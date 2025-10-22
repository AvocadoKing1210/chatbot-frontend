"use client"

import * as React from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { 
  ChatItem, 
  Message, 
  CreateChatData, 
  createNewChat, 
  addMessageToChat, 
  updateChatTitle, 
  updateChatTags,
  getChats,
  getPinnedChats,
  getRecentChats,
  createChat,
  updateChat,
  deleteChat,
  addMessageToChatDB,
  updateChatTagsInDB
} from "@/data/chats"
import { 
  FolderItem, 
  CreateFolderData, 
  createNewFolder, 
  updateFolder as updateFolderUtil, 
  addChatToFolder, 
  removeChatFromFolder, 
  moveChatBetweenFolders,
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  moveChatToFolder
} from "@/data/folders"

interface ChatContextType {
  // Current chat state
  currentChat: ChatItem | null
  setCurrentChat: (chat: ChatItem | null) => void
  
  // Chat list state
  chats: ChatItem[]
  setChats: React.Dispatch<React.SetStateAction<ChatItem[]>>
  
  // Folder state
  folders: FolderItem[]
  setFolders: React.Dispatch<React.SetStateAction<FolderItem[]>>
  
  // Loading states
  isLoading: boolean
  
  // Animation states
  animatingChats: Set<string>
  setAnimatingChats: React.Dispatch<React.SetStateAction<Set<string>>>
  animatingFolders: Set<string>
  setAnimatingFolders: React.Dispatch<React.SetStateAction<Set<string>>>
  
  // Chat operations
  createChat: (data: CreateChatData) => Promise<ChatItem>
  addMessage: (chatId: string, content: string, role: 'user' | 'assistant') => Promise<string>
  updateChat: (chatId: string, updates: Partial<ChatItem>) => Promise<void>
  deleteChat: (chatId: string) => Promise<void>
  togglePin: (chatId: string) => void
  
  // Folder operations
  createFolder: (data: CreateFolderData) => Promise<FolderItem>
  updateFolder: (folderId: string, updates: Partial<FolderItem>) => Promise<void>
  deleteFolder: (folderId: string) => Promise<void>
  moveChatToFolder: (chatId: string, folderId?: string) => Promise<void>
  
  // Animation operations
  animateChatOperation: (chatId: string, operation: 'pin' | 'unpin' | 'move' | 'delete' | 'add') => void
  onAnimationComplete: (chatId: string, animationType: string) => void
  animateFolderOperation: (folderId: string, operation: 'delete' | 'add') => void
  onFolderAnimationComplete: (folderId: string, animationType: string) => void
  
  // AI response simulation
  generateAIResponse: (userMessage: string) => string
}

const ChatContext = React.createContext<ChatContextType | undefined>(undefined)

export function useChat() {
  const context = React.useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

interface ChatProviderProps {
  children: React.ReactNode
}

export function ChatProvider({ children }: ChatProviderProps) {
  const { user } = useAuth()
  const [currentChat, setCurrentChat] = React.useState<ChatItem | null>(null)
  const [chats, setChats] = React.useState<ChatItem[]>([])
  const [folders, setFolders] = React.useState<FolderItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [animatingChats, setAnimatingChats] = React.useState<Set<string>>(new Set())
  const [animatingFolders, setAnimatingFolders] = React.useState<Set<string>>(new Set())
  
  // Load data when user is authenticated
  React.useEffect(() => {
    if (user?.id) {
      loadUserData()
    } else {
      setChats([])
      setFolders([])
      setIsLoading(false)
    }
  }, [user?.id])

  const loadUserData = async () => {
    if (!user?.id) return
    
    try {
      setIsLoading(true)
      
      // Fetch chats and folders in parallel
      const [userChats, userFolders] = await Promise.all([
        getChats(user.id),
        getFolders(user.id)
      ])
      
      setChats(userChats)
      setFolders(userFolders)
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter out empty chats (chats with no messages) for display purposes
  const nonEmptyChats = React.useMemo(() => 
    chats.filter(chat => chat.messages.length > 0), 
    [chats]
  )

  // Generate mock AI responses with rich content
  const generateAIResponse = React.useCallback((userMessage: string): string => {
    const responses = [
      // Response with code blocks and inline code
      `Great question! Here's how you can implement this using modern JavaScript:

\`\`\`javascript
// Example: Creating a reusable component
const MyComponent = ({ title, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div className="component-wrapper">
      <h2>{title}</h2>
      <button onClick={() => setIsVisible(!isVisible)}>
        Toggle Visibility
      </button>
      {isVisible && <div>{children}</div>}
    </div>
  );
};
\`\`\`

You can use this pattern with \`useState\`, \`useEffect\`, and \`useCallback\` hooks. The key is to keep your components **focused** and **reusable**.

**Key Benefits:**
- ✅ Easy to test with \`jest\` and \`@testing-library/react\`
- ✅ Reusable across projects using \`npm\` or \`yarn\`
- ✅ Maintainable code structure with \`TypeScript\` and \`ESLint\`

**Common Patterns:**
- Use \`React.memo()\` for performance optimization
- Implement \`useMemo()\` for expensive calculations
- Apply \`useRef()\` for DOM manipulation`,

      // Response with tables and lists
      `Here's a comprehensive breakdown of the different approaches:

## Comparison Table

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **Class Components** | Mature, stable | Verbose syntax | Legacy projects |
| **Functional Components** | Clean, modern | Learning curve | New projects |
| **Custom Hooks** | Reusable logic | Abstraction overhead | Complex state |

## Implementation Steps

1. **Setup Environment**
   \`\`\`bash
   npm install react react-dom
   npx create-react-app my-app
   \`\`\`

2. **Create Component**
   \`\`\`jsx
   import React from 'react';
   
   const App = () => {
     return <h1>Hello World!</h1>;
   };
   \`\`\`

3. **Add Styling**
   - Use CSS modules for scoped styles with \`module.css\`
   - Consider \`styled-components\` for dynamic styling
   - Implement responsive design with \`@media\` queries
   - Use \`Tailwind CSS\` for utility-first approach

**Key Commands:**
- \`npm start\` - Start development server
- \`npm run build\` - Create production build
- \`npm test\` - Run test suite with \`Jest\``,

      // Response with math and technical content
      `Excellent question! Let me explain the mathematical foundation behind this:

## Mathematical Model

The efficiency can be calculated using this formula:

$$E = \\frac{Output}{Input} \\times 100\\%$$

Where:
- \`E\` = Efficiency percentage
- \`Output\` = Desired result
- \`Input\` = Resources consumed

## Code Implementation

\`\`\`python
import numpy as np
import matplotlib.pyplot as plt

def calculate_efficiency(input_data, output_data):
    """
    Calculate efficiency based on input/output ratio
    """
    efficiency = (output_data / input_data) * 100
    return efficiency

# Example usage
input_resources = 1000
output_results = 850
efficiency = calculate_efficiency(input_resources, output_results)
print(f"Efficiency: {efficiency:.2f}%")
\`\`\`

## Performance Metrics

- **Time Complexity**: \`O(n log n)\` - Logarithmic time complexity
- **Space Complexity**: \`O(1)\` - Constant space usage
- **Memory Usage**: ~\`2.5MB\` for typical datasets
- **CPU Usage**: \`15-20%\` average load

**Key Libraries:**
- \`numpy\` for numerical computations
- \`matplotlib\` for data visualization
- \`pandas\` for data manipulation`,

      // Response with blockquotes and emphasis
      `That's a fantastic approach! Here's my analysis:

> "The best way to predict the future is to create it." - This principle applies perfectly to your situation.

## Key Considerations

**Important**: Always validate your inputs before processing:

\`\`\`typescript
interface UserInput {
  name: string;
  email: string;
  age: number;
}

const validateInput = (input: UserInput): boolean => {
  if (!input.name || input.name.length < 2) {
    throw new Error('Name must be at least 2 characters');
  }
  
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  if (!emailRegex.test(input.email)) {
    throw new Error('Invalid email format');
  }
  
  return true;
};
\`\`\`

## Best Practices

1. **Error Handling**: Always wrap async operations in \`try-catch\` blocks
2. **Type Safety**: Use \`TypeScript\` for better development experience
3. **Testing**: Write unit tests with \`Jest\` and \`@testing-library\`
4. **Linting**: Use \`ESLint\` and \`Prettier\` for code quality
5. **Version Control**: Use \`git\` with proper commit messages

*Remember*: \`console.log()\`, \`console.error()\`, and \`console.warn()\` are your friends during development!

**Debugging Tools:**
- \`React DevTools\` for component inspection
- \`Redux DevTools\` for state management
- \`Chrome DevTools\` for performance profiling`,

      // Response with links and advanced formatting
      `Perfect! Here's a complete solution with multiple approaches:

## Method 1: Using Modern ES6+ Features

\`\`\`javascript
// Destructuring and arrow functions
const processData = async ({ data, options = {} }) => {
  const { format = 'json', validate = true } = options;
  
  if (validate) {
    const isValid = await validateData(data);
    if (!isValid) throw new Error('Invalid data format');
  }
  
  return data.map(item => ({
    ...item,
    processed: true,
    timestamp: new Date().toISOString()
  }));
};
\`\`\`

## Method 2: Using React Hooks

\`\`\`jsx
import { useState, useEffect, useCallback } from 'react';

const DataProcessor = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return (
    <div>
      {loading ? 'Loading...' : data.length}
    </div>
  );
};
\`\`\`

## Performance Tips

- Use \`useMemo\` for expensive calculations
- Implement \`useCallback\` for stable function references
- Consider \`React.memo\` for component optimization
- Use \`React.lazy\` for code splitting
- Implement \`Suspense\` for loading states

**Pro Tip**: Always measure performance with \`console.time()\`, \`console.timeEnd()\`, and \`performance.now()\`!

**Optimization Tools:**
- \`React Profiler\` for component performance
- \`Bundle Analyzer\` for bundle size analysis
- \`Lighthouse\` for web performance metrics`,

      // Response with SQL and database content
      `Great question about database optimization! Here's a comprehensive approach:

## SQL Query Optimization

\`\`\`sql
-- Optimized query with proper indexing
SELECT 
    u.id,
    u.username,
    u.email,
    COUNT(p.id) as post_count,
    MAX(p.created_at) as last_post
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE u.created_at >= '2024-01-01'
    AND u.status = 'active'
GROUP BY u.id, u.username, u.email
HAVING COUNT(p.id) > 5
ORDER BY post_count DESC
LIMIT 10;
\`\`\`

## Database Schema

\`\`\`sql
-- Create optimized indexes
CREATE INDEX idx_users_created_status ON users(created_at, status);
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at);

-- Add foreign key constraints
ALTER TABLE posts 
ADD CONSTRAINT fk_posts_user_id 
FOREIGN KEY (user_id) REFERENCES users(id);
\`\`\`

## Performance Metrics

| Query Type | Before Optimization | After Optimization | Improvement |
|------------|-------------------|-------------------|-------------|
| **SELECT** | 2.3s | 0.1s | **95% faster** |
| **JOIN** | 1.8s | 0.05s | **97% faster** |
| **COUNT** | 0.9s | 0.02s | **98% faster** |

**Key Points:**
- Use \`EXPLAIN ANALYZE\` to understand query execution
- Index frequently queried columns with \`CREATE INDEX\`
- Consider \`PARTITION BY\` for large tables
- Use \`VACUUM\` and \`ANALYZE\` for maintenance
- Monitor with \`pg_stat_statements\` extension

**Database Tools:**
- \`pgAdmin\` for database administration
- \`DBeaver\` for cross-platform database management
- \`DataGrip\` for advanced SQL development`,

      // Response with API and networking content
      `Excellent! Here's how to implement a robust API solution:

## RESTful API Design

\`\`\`javascript
// Express.js API endpoint
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    // Validation
    if (!name || !email) {
      return res.status(400).json({
        error: 'Name and email are required',
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Create user
    const user = await User.create({
      name,
      email,
      role: role || 'user',
      createdAt: new Date()
    });
    
    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});
\`\`\`

## API Testing with cURL

\`\`\`bash
# Create a new user
curl -X POST http://localhost:3000/api/users \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin"
  }'

# Response
{
  "success": true,
  "data": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin"
  }
}
\`\`\`

## Error Handling Strategy

- **400**: Bad Request (validation errors)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found (resource doesn't exist)
- **500**: Internal Server Error (server issues)

**API Testing Tools:**
- \`Postman\` for API testing and documentation
- \`Insomnia\` for REST client functionality
- \`curl\` for command-line testing
- \`Jest\` and \`Supertest\` for automated testing

**Authentication Methods:**
- \`JWT\` tokens for stateless authentication
- \`OAuth 2.0\` for third-party integration
- \`API Keys\` for simple access control`,

      // Response with frontend framework content
      `Perfect! Here's a modern frontend implementation:

## React Component with TypeScript

\`\`\`tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserCardProps {
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onEdit, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      className="user-card"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="avatar">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} />
        ) : (
          <div className="default-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      <div className="user-info">
        <h3>{user.name}</h3>
        <p>{user.email}</p>
      </div>
      
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="actions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <button onClick={() => onEdit(user.id)}>
              Edit
            </button>
            <button onClick={() => onDelete(user.id)}>
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
\`\`\`

## CSS Styling

\`\`\`css
.user-card {
  @apply bg-white rounded-lg shadow-md p-4 transition-all duration-200;
  border: 1px solid #e5e7eb;
}

.user-card:hover {
  @apply shadow-lg border-blue-300;
}

.avatar {
  @apply w-12 h-12 rounded-full overflow-hidden mb-3;
}

.default-avatar {
  @apply w-full h-full bg-blue-500 text-white flex items-center justify-center font-semibold;
}

.actions {
  @apply flex gap-2 mt-3;
}

.actions button {
  @apply px-3 py-1 text-sm rounded transition-colors;
}

.actions button:first-child {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.actions button:last-child {
  @apply bg-red-500 text-white hover:bg-red-600;
}
\`\`\`

**Features:**
- ✨ Smooth animations with \`Framer Motion\`
- 🎨 Responsive design with \`Tailwind CSS\`
- 🔧 \`TypeScript\` for type safety
- ♿ Accessible interactions with \`ARIA\` attributes

**Styling Approaches:**
- \`CSS Modules\` for scoped styles
- \`Styled Components\` for dynamic styling
- \`Emotion\` for CSS-in-JS solutions
- \`Sass\` and \`Less\` for preprocessor features`,

      // Response with DevOps and deployment content
      `Great question about deployment! Here's a complete CI/CD pipeline:

## Docker Configuration

\`\`\`dockerfile
# Multi-stage build for optimization
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
\`\`\`

## GitHub Actions Workflow

\`\`\`yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test
      - run: npm run build
      
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          configPath: './lighthouse.config.js'

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to AWS
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy
        run: |
          aws s3 sync ./dist s3://\${{ secrets.S3_BUCKET }}
          aws cloudfront create-invalidation --distribution-id \${{ secrets.CLOUDFRONT_ID }} --paths "/*"
\`\`\`

## Environment Configuration

\`\`\`bash
# .env.production
NODE_ENV=production
API_URL=https://api.myapp.com
DATABASE_URL=postgresql://user:pass@db:5432/myapp
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secret-key
\`\`\`

## Monitoring Setup

- **Uptime**: \`UptimeRobot\` for availability monitoring
- **Performance**: \`New Relic\` for application metrics
- **Logs**: \`CloudWatch\` for centralized logging
- **Alerts**: \`PagerDuty\` for incident management

**DevOps Tools:**
- \`Docker\` for containerization
- \`Kubernetes\` for orchestration
- \`Terraform\` for infrastructure as code
- \`Ansible\` for configuration management
- \`Jenkins\` for CI/CD pipelines

**Cloud Platforms:**
- \`AWS\` for comprehensive cloud services
- \`Azure\` for Microsoft ecosystem integration
- \`Google Cloud\` for machine learning capabilities`,

      // Response with data science and ML content
      `Excellent question about machine learning! Here's a comprehensive approach:

## Data Preprocessing Pipeline

\`\`\`python
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import seaborn as sns

class DataProcessor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
    
    def load_data(self, file_path):
        """Load and inspect the dataset"""
        self.df = pd.read_csv(file_path)
        print(f"Dataset shape: {self.df.shape}")
        print(f"Missing values: {self.df.isnull().sum().sum()}")
        return self.df
    
    def preprocess(self):
        """Clean and preprocess the data"""
        # Handle missing values
        self.df = self.df.fillna(self.df.median())
        
        # Encode categorical variables
        categorical_cols = self.df.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            self.df[col] = self.label_encoder.fit_transform(self.df[col])
        
        return self.df
    
    def visualize(self):
        """Create exploratory data analysis plots"""
        plt.figure(figsize=(12, 8))
        
        # Correlation heatmap
        plt.subplot(2, 2, 1)
        sns.heatmap(self.df.corr(), annot=True, cmap='coolwarm')
        plt.title('Feature Correlation Matrix')
        
        # Distribution plots
        plt.subplot(2, 2, 2)
        self.df.hist(bins=30, ax=plt.gca())
        plt.title('Feature Distributions')
        
        plt.tight_layout()
        plt.show()

# Usage
processor = DataProcessor()
data = processor.load_data('dataset.csv')
clean_data = processor.preprocess()
processor.visualize()
\`\`\`

## Machine Learning Model

\`\`\`python
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
import joblib

class MLPipeline:
    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
    
    def train(self, X, y):
        """Train the model"""
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        print("Classification Report:")
        print(classification_report(y_test, y_pred))
        
        return self.model
    
    def predict(self, X):
        """Make predictions"""
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)
    
    def save_model(self, filepath):
        """Save the trained model"""
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler
        }, filepath)

# Usage
pipeline = MLPipeline()
model = pipeline.train(X, y)
predictions = pipeline.predict(X_new)
pipeline.save_model('model.pkl')
\`\`\`

## Model Performance Metrics

| Metric | Score | Interpretation |
|--------|-------|----------------|
| **Accuracy** | 0.94 | 94% correct predictions |
| **Precision** | 0.92 | Low false positive rate |
| **Recall** | 0.89 | Good at finding positives |
| **F1-Score** | 0.90 | Balanced precision/recall |

**Next Steps:**
- Implement cross-validation with \`cross_val_score\`
- Use \`GridSearchCV\` for hyperparameter tuning
- Consider ensemble methods like \`RandomForest\` and \`XGBoost\`
- Apply \`feature_selection\` for dimensionality reduction

**ML Libraries:**
- \`scikit-learn\` for traditional machine learning
- \`TensorFlow\` for deep learning
- \`PyTorch\` for research and development
- \`Pandas\` for data manipulation
- \`NumPy\` for numerical computing

**Model Evaluation:**
- \`accuracy_score\` for classification accuracy
- \`mean_squared_error\` for regression metrics
- \`confusion_matrix\` for detailed analysis
- \`roc_auc_score\` for binary classification`
    ]
    
    // Use random selection instead of hash-based for variety
    const randomIndex = Math.floor(Math.random() * responses.length)
    return responses[randomIndex]
  }, [])

  // Animation functions
  const animateChatOperation = React.useCallback((chatId: string, operation: 'pin' | 'unpin' | 'move' | 'delete' | 'add') => {
    const animationKey = `${chatId}-${operation}`
    setAnimatingChats(prev => new Set([...prev, animationKey]))
  }, [])

  const onAnimationComplete = React.useCallback((chatId: string, animationType: string) => {
    const animationKey = `${chatId}-${animationType}`
    // Immediate cleanup for pin/unpin operations to eliminate blank time
    setAnimatingChats(prev => {
      const newSet = new Set(prev)
      newSet.delete(animationKey)
      return newSet
    })
  }, [])

  // Folder animation functions
  const animateFolderOperation = React.useCallback((folderId: string, operation: 'delete' | 'add') => {
    const animationKey = `${folderId}-${operation}`
    setAnimatingFolders(prev => new Set([...prev, animationKey]))
  }, [])

  const onFolderAnimationComplete = React.useCallback((folderId: string, animationType: string) => {
    const animationKey = `${folderId}-${animationType}`
    setAnimatingFolders(prev => {
      const newSet = new Set(prev)
      newSet.delete(animationKey)
      return newSet
    })
  }, [])

  const createChatHandler = React.useCallback(async (data: CreateChatData): Promise<ChatItem> => {
    if (!user?.id) throw new Error('User not authenticated')
    
    try {
      const newChat = await createChat(user.id, data)
      setChats(prev => [newChat, ...prev])
      
      // Animate the new chat
      animateChatOperation(newChat.id, 'add')
      
      // Only set as current chat if it has an initial message
      if (data.initialMessage) {
        setCurrentChat(newChat)
      }
      
      return newChat
    } catch (error) {
      console.error('Error creating chat:', error)
      throw error
    }
  }, [user?.id])

  const addMessage = React.useCallback(async (chatId: string, content: string, role: 'user' | 'assistant'): Promise<string> => {
    try {
      // Add message to database
      const newMessage = await addMessageToChatDB(chatId, content, role)
      
      // Update local state
      setChats(prev => {
        const updatedChats = prev.map(chat => {
          if (chat.id === chatId) {
            const updatedChat = addMessageToChat(chat, content, role)
            if (currentChat?.id === chatId) {
              setCurrentChat(updatedChat)
            }
            return updatedChat
          }
          return chat
        })
        return updatedChats
      })
      
      return newMessage.id
    } catch (error) {
      console.error('Error adding message:', error)
      throw error
    }
  }, [currentChat])

  const updateChatHandler = React.useCallback(async (chatId: string, updates: Partial<ChatItem>) => {
    try {
      // Update in database
      await updateChat(chatId, updates)
      
      // Update local state
      setChats(prev => {
        const updatedChats = prev.map(chat => {
          if (chat.id === chatId) {
            // Only update timestamp for meaningful changes (not just mode/chart toggles)
            const shouldUpdateTimestamp = updates.title || updates.tags || updates.messages
            const updatedChat = { 
              ...chat, 
              ...updates, 
              // Update preview to match title when title changes
              ...(updates.title && { preview: updates.title }),
              ...(shouldUpdateTimestamp && { updatedAt: new Date().toISOString() })
            }
            
            // Only update currentChat for meaningful changes to prevent message bouncing
            if (currentChat?.id === chatId && (updates.title || updates.tags || updates.messages)) {
              setCurrentChat(updatedChat)
            }
            
            return updatedChat
          }
          return chat
        })
        return updatedChats
      })
    } catch (error) {
      console.error('Error updating chat:', error)
      throw error
    }
  }, [currentChat])

  const deleteChatHandler = React.useCallback(async (chatId: string) => {
    try {
      // Start delete animation
      animateChatOperation(chatId, 'delete')
      
      // Wait for animation to complete before actually deleting
      setTimeout(async () => {
        try {
          // Delete from database
          await deleteChat(chatId)
          
          // Update local state
          setChats(prev => prev.filter(chat => chat.id !== chatId))
          if (currentChat?.id === chatId) {
            setCurrentChat(null)
          }
        } catch (error) {
          console.error('Error deleting chat:', error)
        }
      }, 200) // Reduced to match new animation duration
    } catch (error) {
      console.error('Error deleting chat:', error)
      throw error
    }
  }, [currentChat, animateChatOperation])

  const togglePin = React.useCallback((chatId: string) => {
    const chat = chats.find(c => c.id === chatId)
    if (!chat) return
    
    // Start pin animation immediately
    animateChatOperation(chatId, chat.pinned ? 'unpin' : 'pin')
    
    // Update local state immediately for instant UI feedback
    setChats(prev => {
      const updatedChats = prev.map(chat => {
        if (chat.id === chatId) {
          const updatedChat = { 
            ...chat, 
            pinned: !chat.pinned,
            updatedAt: new Date().toISOString()
          }
          
          // Update currentChat if it's the one being pinned/unpinned
          if (currentChat?.id === chatId) {
            setCurrentChat(updatedChat)
          }
          
          return updatedChat
        }
        return chat
      })
      return updatedChats
    })
    
    // Update database in background (don't wait for it)
    updateChat(chatId, { pinned: !chat.pinned }).catch(error => {
      console.error('Error updating pin in database:', error)
      // Revert the local state if database update fails
      setChats(prev => {
        const revertedChats = prev.map(chat => {
          if (chat.id === chatId) {
            return { 
              ...chat, 
              pinned: chat.pinned, // Revert to original state
              updatedAt: new Date().toISOString()
            }
          }
          return chat
        })
        return revertedChats
      })
      // Also revert currentChat if it was updated
      if (currentChat?.id === chatId) {
        setCurrentChat(prev => prev ? { ...prev, pinned: chat.pinned } : null)
      }
    })
  }, [currentChat, chats, animateChatOperation])

  // Folder operations
  const createFolderHandler = React.useCallback(async (data: CreateFolderData): Promise<FolderItem> => {
    if (!user?.id) throw new Error('User not authenticated')
    
    try {
      const newFolder = await createFolder(user.id, data)
      setFolders(prev => [newFolder, ...prev])
      
      // Animate the new folder
      animateFolderOperation(newFolder.id, 'add')
      
      return newFolder
    } catch (error) {
      console.error('Error creating folder:', error)
      throw error
    }
  }, [user?.id, animateFolderOperation])

  const updateFolderHandler = React.useCallback(async (folderId: string, updates: Partial<FolderItem>) => {
    try {
      // Update in database
      await updateFolder(folderId, {
        name: updates.name,
        description: updates.description
      })
      
      // Update local state
      setFolders(prev => {
        const updatedFolders = prev.map(folder => {
          if (folder.id === folderId) {
            return {
              ...folder,
              ...updates,
              updatedAt: new Date().toISOString()
            }
          }
          return folder
        })
        return updatedFolders
      })
    } catch (error) {
      console.error('Error updating folder:', error)
      throw error
    }
  }, [])

  const deleteFolderHandler = React.useCallback(async (folderId: string) => {
    try {
      // Start delete animation
      animateFolderOperation(folderId, 'delete')
      
      // Wait for animation to complete before actually deleting
      setTimeout(async () => {
        try {
          // Delete from database
          await deleteFolder(folderId)
          
          // Update local state
          setFolders(prev => prev.filter(folder => folder.id !== folderId))
          
          // Remove folderId from all chats that were in this folder
          setChats(prev => {
            const updatedChats = prev.map(chat => {
              if (chat.folderId === folderId) {
                return { ...chat, folderId: undefined }
              }
              return chat
            })
            return updatedChats
          })
        } catch (error) {
          console.error('Error deleting folder:', error)
        }
      }, 200) // Match the same timing as chat delete animation
    } catch (error) {
      console.error('Error deleting folder:', error)
      throw error
    }
  }, [animateFolderOperation])

  const moveChatToFolderHandler = React.useCallback(async (chatId: string, folderId?: string) => {
    try {
      // Start move animation
      animateChatOperation(chatId, 'move')
      
      // Update in database
      await moveChatToFolder(chatId, folderId || null)
      
      // Update local state
      setChats(prev => {
        const updatedChats = prev.map(chat => {
          if (chat.id === chatId) {
            return { ...chat, folderId }
          }
          return chat
        })
        return updatedChats
      })

      // Update folder's chatIds
      setFolders(prev => {
        return prev.map(folder => {
          if (folderId && folder.id === folderId) {
            // Add chat to target folder
            return addChatToFolder(folder, chatId)
          } else if (folder.chatIds.includes(chatId)) {
            // Remove chat from current folder
            return removeChatFromFolder(folder, chatId)
          }
          return folder
        })
      })
    } catch (error) {
      console.error('Error moving chat to folder:', error)
      throw error
    }
  }, [animateChatOperation])

  const value: ChatContextType = {
    currentChat,
    setCurrentChat,
    chats: nonEmptyChats, // Only expose non-empty chats
    setChats,
    folders,
    setFolders,
    isLoading,
    animatingChats,
    setAnimatingChats,
    animatingFolders,
    setAnimatingFolders,
    createChat: createChatHandler,
    addMessage,
    updateChat: updateChatHandler,
    deleteChat: deleteChatHandler,
    togglePin,
    createFolder: createFolderHandler,
    updateFolder: updateFolderHandler,
    deleteFolder: deleteFolderHandler,
    moveChatToFolder: moveChatToFolderHandler,
    animateChatOperation,
    onAnimationComplete,
    animateFolderOperation,
    onFolderAnimationComplete,
    generateAIResponse
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}
