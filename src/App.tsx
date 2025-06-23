import { useState } from 'react'
import './App.css'
import Layout from './layouts/layout'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Layout>
        <p>hello world</p>
      </Layout>
    </>
  )
}

export default App
