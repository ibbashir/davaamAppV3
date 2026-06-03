import { BrowserRouter } from "react-router-dom"
import { CookiesProvider } from "react-cookie"
import { Toaster } from "sonner"
import { AuthProvider } from "./contexts/AuthContext"
import Routing from "./routing/Routing"

function App() {
  return (
    <CookiesProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routing />
          <Toaster position="top-right" richColors closeButton duration={4000} />
        </BrowserRouter>
      </AuthProvider>
    </CookiesProvider>
  )
}

export default App
