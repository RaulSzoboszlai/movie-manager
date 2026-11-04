import { Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import HomePage from './pages/HomePage.jsx'
import LibraryPage from './pages/LibraryPage.jsx'
import ListDetailsPage from './pages/ListDetailsPage.jsx'
import ListsPage from './pages/ListsPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import MovieDetailsPage from './pages/MovieDetailsPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import SearchPage from './pages/SearchPage.jsx'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/movie/:tmdbId" element={<MovieDetailsPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/lists" element={<ListsPage />} />
        <Route path="/lists/:id" element={<ListDetailsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
