import { BrowserRouter } from 'react-router-dom'
import Routing from './routing/Routing'
import { AuthProvider } from './contexts/AuthContext'
import { CookiesProvider } from 'react-cookie';

function App() {
  return (
    <CookiesProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routing />
        </BrowserRouter>
      </AuthProvider>
    </CookiesProvider>

  )
}

export default App
