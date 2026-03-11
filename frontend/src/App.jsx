import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Show, RedirectToSignIn } from '@clerk/react';
import Layout from './components/Layout';
import Chat from './pages/Chat';
import KnowledgeBase from './pages/KnowledgeBase';

function App() {
  return (
    <Router>
      <Show when="signed-out">
        <RedirectToSignIn />
      </Show>
      <Show when="signed-in">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Chat />} />
            <Route path="knowledge" element={<KnowledgeBase />} />
          </Route>
        </Routes>
      </Show>
    </Router>
  );
}
export default App;