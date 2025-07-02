import { BrowserRouter } from 'react-router-dom'
import Routing from './routing/Routing'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routing />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
