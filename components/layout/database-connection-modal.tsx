'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Database, Plug, Loader2, ChevronDown, ChevronRight, CheckCircle, XCircle, Save, AlertCircle, Plus, Edit, Trash2, ArrowLeft, Eye, EyeOff, RotateCcw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { DatabaseConnectionService, type ConnectionTestResult, type SavedConnection } from '@/lib/database/connection-service'

interface DatabaseConnectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ConnectionFormData {
  name: string
  connectionString: string
}

type ViewMode = 'list' | 'create' | 'edit'

export function DatabaseConnectionModal({
  open,
  onOpenChange
}: DatabaseConnectionModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [savedConnections, setSavedConnections] = useState<SavedConnection[]>([])
  const [editingConnection, setEditingConnection] = useState<SavedConnection | null>(null)
  const [formData, setFormData] = useState<ConnectionFormData>({
    name: '',
    connectionString: ''
  })
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null)
  const [, setShowPreview] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState({
    connection: false,
    preview: false,
  })
  const [validationError, setValidationError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const { toast } = useToast()

  // Load saved connections when modal opens
  useEffect(() => {
    if (open) {
      const loadConnections = async () => {
        try {
          // First, try to migrate any localStorage connections
          await DatabaseConnectionService.migrateFromLocalStorage()
          
          // Then load connections from Supabase
          const connections = await DatabaseConnectionService.getSavedConnections()
          setSavedConnections(connections)
          setViewMode('list')
        } catch (error) {
          console.error('Error loading connections:', error)
          setSavedConnections([])
        }
      }
      loadConnections()
    }
  }, [open])

  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleCreateNew = () => {
    setFormData({ name: '', connectionString: '' })
    setTestResult(null)
    setShowPreview(false)
    setValidationError(null)
    setEditingConnection(null)
    setViewMode('create')
    // Reset collapsed sections for create mode
    setCollapsedSections({
      connection: false,
      preview: false
    })
  }

  const handleEditConnection = (connection: SavedConnection) => {
    setFormData({
      name: connection.name,
      connectionString: connection.connectionString
    })
    setTestResult(null)
    setShowPreview(false)
    setValidationError(null)
    setEditingConnection(connection)
    setViewMode('edit')
    // Close preview section when editing
    setCollapsedSections(prev => ({ ...prev, preview: true }))
  }

  const handleDeleteConnection = async (connectionId: string) => {
    try {
      await DatabaseConnectionService.deleteConnection(connectionId)
      const updatedConnections = await DatabaseConnectionService.getSavedConnections()
      setSavedConnections(updatedConnections)
      toast({
        title: "Connection Deleted",
        description: "Database connection has been deleted successfully.",
        action: <Trash2 className="h-4 w-4 text-red-500" />
      })
    } catch (error) {
      console.error('Error deleting connection:', error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete the connection. Please try again.",
        action: <XCircle className="h-4 w-4 text-red-500" />
      })
    }
  }

  const handleBackToList = () => {
    setViewMode('list')
    setFormData({ name: '', connectionString: '' })
    setTestResult(null)
    setShowPreview(false)
    setValidationError(null)
    setEditingConnection(null)
    setShowPassword(false)
    // Reset collapsed sections
    setCollapsedSections({
      connection: false,
      preview: false
    })
  }

  const getDisplayConnectionString = () => {
    if (viewMode === 'edit' && !showPassword) {
      return DatabaseConnectionService.sanitizeConnectionString(formData.connectionString)
    }
    return formData.connectionString
  }

  const handleReloadPreview = () => {
    if (testResult?.success) {
      handleTestConnection()
    }
  }

  const handleTestConnection = async () => {
    if (!formData.connectionString.trim()) {
      toast({
        title: "Connection String Required",
        description: "Please enter a PostgreSQL connection string to test.",
        action: <XCircle className="h-4 w-4 text-red-500" />
      })
      return
    }

    // Validate connection string format
    const validation = DatabaseConnectionService.validateConnectionString(formData.connectionString)
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid connection string')
      toast({
        title: "Invalid Connection String",
        description: validation.error || 'Please check your connection string format.',
        action: <AlertCircle className="h-4 w-4 text-red-500" />
      })
      return
    }

    setValidationError(null)
    setIsTesting(true)
    setTestResult(null)
    setShowPreview(false)

    // Show initial toast for cold start awareness
    toast({
      title: "Testing Connection",
      description: "Connecting to database... This may take longer on the first attempt.",
      action: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    })

    try {
      const result = await DatabaseConnectionService.testConnection(formData.connectionString)
      console.log('Connection test result:', result)
      setTestResult(result)
      
      if (result.success) {
        setShowPreview(true)
        // Auto-expand preview section on successful connection
        setCollapsedSections(prev => ({
          ...prev,
          preview: false
        }))
        
        toast({
          title: "Connection Successful",
          description: result.message,
          action: <CheckCircle className="h-4 w-4 text-green-500" />
        })
      } else {
        const errorDescription = result.detailedError 
          ? `${result.message}\n\nTechnical details: ${result.detailedError}`
          : result.message
        
        toast({
          title: "Connection Failed",
          description: errorDescription,
          action: <XCircle className="h-4 w-4 text-red-500" />
        })
      }
    } catch (error) {
      console.error('Connection test error:', error)
      const errorResult: ConnectionTestResult = {
        success: false,
        message: "Network error. Please check your connection and try again."
      }
      setTestResult(errorResult)
      
      toast({
        title: "Connection Failed",
        description: "Network error. Please check your connection and try again.",
        action: <XCircle className="h-4 w-4 text-red-500" />
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSaveConnection = async () => {
    if (!testResult?.success) {
      toast({
        title: "Test Connection First",
        description: "Please test the connection before saving.",
        action: <XCircle className="h-4 w-4 text-red-500" />
      })
      return
    }

    if (!formData.name.trim()) {
      toast({
        title: "Connection Name Required",
        description: "Please enter a name for this connection.",
        action: <XCircle className="h-4 w-4 text-red-500" />
      })
      return
    }

    try {
      let savedConnection: SavedConnection

      if (editingConnection) {
        // Update existing connection
        await DatabaseConnectionService.deleteConnection(editingConnection.id)
        savedConnection = await DatabaseConnectionService.saveConnection({
          name: formData.name.trim(),
          connectionString: formData.connectionString,
          isValid: true,
          tableCount: testResult.tables?.length
        })
      } else {
        // Create new connection
        savedConnection = await DatabaseConnectionService.saveConnection({
          name: formData.name.trim(),
          connectionString: formData.connectionString,
          isValid: true,
          tableCount: testResult.tables?.length
        })
      }

      // Update connection status with test results
      await DatabaseConnectionService.updateConnectionStatus(
        savedConnection.id,
        true,
        testResult.tables?.length
      )

      // Refresh the connections list
      const updatedConnections = await DatabaseConnectionService.getSavedConnections()
      setSavedConnections(updatedConnections)

      toast({
        title: editingConnection ? "Connection Updated" : "Connection Saved",
        description: `Database connection "${savedConnection.name}" has been ${editingConnection ? 'updated' : 'saved'} successfully.`,
        action: <Save className="h-4 w-4 text-blue-500" />
      })
      
      // Reset form and go back to list
      handleBackToList()
    } catch (error) {
      console.error('Error saving connection:', error)
      toast({
        title: "Save Failed",
        description: "Failed to save the connection. Please try again.",
        action: <XCircle className="h-4 w-4 text-red-500" />
      })
    }
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {viewMode === 'edit' && (
          <div className="fixed top-4 left-4 z-50">
            <Button
              variant="ghost"
              onClick={handleBackToList}
              className="px-3 py-2 h-auto text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md shadow-sm bg-background/95 backdrop-blur-sm border"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to connections
            </Button>
          </div>
        )}
        
        {viewMode !== 'edit' && (
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plug className="h-5 w-5" />
              {viewMode === 'list' ? 'Database Connections' : 'Create New Connection'}
            </DialogTitle>
            <DialogDescription>
              {viewMode === 'list' ? 'Manage your saved database connections.' :
               'Configure your PostgreSQL database connection to enable data analysis and querying features.'}
            </DialogDescription>
          </DialogHeader>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 px-4 sm:px-6 py-1" style={{ paddingTop: viewMode === 'edit' ? '60px' : undefined }}>
          {viewMode === 'list' ? (
            // List View
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Saved Connections</h3>
                <Button onClick={handleCreateNew} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Connection
                </Button>
              </div>
              
              {savedConnections.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No connections saved</h3>
                  <p className="text-muted-foreground mb-4">Create your first database connection to get started.</p>
                  <Button onClick={handleCreateNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Connection
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedConnections.map((connection) => (
                    <Card key={connection.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{connection.name}</h4>
                            <Badge variant={connection.isValid ? "default" : "destructive"} className="text-xs">
                              {connection.isValid ? "Valid" : "Invalid"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Tables: {connection.tableCount || 0}</span>
                            <span>Last tested: {connection.lastTested.toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditConnection(connection)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteConnection(connection.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Create/Edit View
            <div className="space-y-4">
          {/* Connection Configuration Section */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between p-2 h-auto"
              onClick={() => toggleSection("connection")}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">CONFIGURATION</span>
              </div>
              {collapsedSections.connection ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            
            {!collapsedSections.connection && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="connection-name">Connection Name</Label>
                    <Input
                      id="connection-name"
                      placeholder="My Database Connection"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="font-medium"
                    />
                    <p className="text-xs text-muted-foreground">
                      Give this connection a memorable name for easy identification
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="connection-string">PostgreSQL Connection String</Label>
                      {viewMode === 'edit' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                          className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Show
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    <Textarea
                      id="connection-string"
                      placeholder="postgresql://username:password@hostname:port/database"
                      value={getDisplayConnectionString()}
                      onChange={(e) => {
                        if (viewMode === 'edit' && !showPassword) {
                          // If password is hidden, don't allow editing
                          return
                        }
                        setFormData(prev => ({ ...prev, connectionString: e.target.value }))
                      }}
                      readOnly={viewMode === 'edit' && !showPassword}
                      className={`min-h-[100px] font-mono text-sm resize-none focus:ring-1 focus:ring-ring focus:ring-offset-0 ${
                        validationError ? 'border-red-500 focus:border-red-500' : ''
                      } ${viewMode === 'edit' && !showPassword ? 'bg-muted/50' : ''}`}
                    />
                    {validationError && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationError}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Example: postgresql://user:password@localhost:5432/mydb
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleTestConnection}
                  disabled={isTesting || !formData.connectionString.trim()}
                  className="w-full min-w-0"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </Button>
              </motion.div>
            )}
          </div>

          {/* Database Preview Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-between p-2 h-auto"
                onClick={() => toggleSection("preview")}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">PREVIEW</span>
                  {testResult?.success && testResult.tables && (
                    <Badge variant="secondary" className="text-xs">
                      {testResult.tables.length} tables
                    </Badge>
                  )}
                </div>
                {collapsedSections.preview ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              {testResult?.success && !collapsedSections.preview && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReloadPreview}
                  disabled={isTesting}
                  className="ml-2 px-2 py-1 h-auto text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reload
                </Button>
              )}
            </div>
            
            {!collapsedSections.preview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {testResult?.success && testResult.tables ? (
                  <div className="border rounded-lg bg-muted/30">
                    <ScrollArea className="h-[400px]">
                      <div className="p-4 space-y-6">
                        {testResult.tables.map((table, tableIndex) => (
                          <div key={table.name} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-mono text-sm font-medium">{table.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {table.rowCount.toLocaleString()} rows
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              {table.columns.map((column) => (
                                <div
                                  key={column.name}
                                  className="flex items-center justify-between text-xs py-1"
                                >
                                  <span className="font-mono text-foreground">
                                    {column.name}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">
                                      {column.type}
                                    </span>
                                    {!column.nullable && (
                                      <Badge variant="outline" className="text-xs px-1 py-0">
                                        NOT NULL
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {tableIndex < (testResult.tables?.length ?? 0) - 1 && (
                              <div className="border-t border-border/50" />
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center border rounded-lg bg-muted/30">
                    <div className="text-center text-muted-foreground">
                      <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Test connection to preview database schema</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2, px-4">
          {viewMode === 'list' ? (
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-auto min-w-[80px]">
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleBackToList} className="w-auto min-w-[80px]">
                Cancel
              </Button>
              <Button
                onClick={handleSaveConnection}
                disabled={!testResult?.success}
                className="w-auto min-w-[80px]"
              >
                {editingConnection ? 'Update Connection' : 'Save Connection'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
