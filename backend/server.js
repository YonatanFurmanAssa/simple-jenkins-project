const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory "database" - simple array
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];

let todos = [
  { id: 1, userId: 1, title: 'Learn Docker', completed: false },
  { id: 2, userId: 1, title: 'Setup Jenkins', completed: true },
  { id: 3, userId: 2, title: 'Deploy with ArgoCD', completed: false }
];

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/users', (req, res) => {
  res.json(users);
});

app.get('/api/todos', (req, res) => {
  res.json(todos);
});

app.post('/api/todos', (req, res) => {
  const { userId, title } = req.body;
  const newTodo = {
    id: todos.length + 1,
    userId: parseInt(userId),
    title,
    completed: false
  };
  todos.push(newTodo);
  res.status(201).json(newTodo);
});

app.put('/api/todos/:id', (req, res) => {
  const todoId = parseInt(req.params.id);
  const todo = todos.find(t => t.id === todoId);
  
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  todo.completed = !todo.completed;
  res.json(todo);
});

app.delete('/api/todos/:id', (req, res) => {
  const todoId = parseInt(req.params.id);
  const index = todos.findIndex(t => t.id === todoId);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  todos.splice(index, 1);
  res.json({ message: 'Todo deleted' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});