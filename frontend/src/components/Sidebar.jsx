import { Search, SlidersHorizontal, Trophy, Home, PlusSquare, Users, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Sidebar = ({
  active = 'home',
  searchTerm = '',
  onSearchChange,
  difficulty = 'all',
  onDifficultyChange,
  showFilters = true,
  role = 'user'
}) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">CJ</span>
        <span className="brand-text">Code Judge</span>
      </div>

      <nav className="sidebar-nav">
        <Link to="/" className={`nav-item ${active === 'home' ? 'active' : ''}`}>
          <Home size={16} />
          Home
        </Link>
        {role === 'admin' && (
          <>
            <Link to="/admin/add-question" className={`nav-item ${active === 'add-question' ? 'active' : ''}`}>
              <PlusSquare size={16} />
              Add Question
            </Link>
            <Link to="/admin/activity" className={`nav-item ${active === 'activity' ? 'active' : ''}`}>
              <Users size={16} />
              User Activity
            </Link>
            <Link to="/admin/contests" className={`nav-item ${active === 'contests' ? 'active' : ''}`}>
              <LayoutGrid size={16} />
              Create Contests
            </Link>
          </>
        )}
        {role !== 'admin' && (
          <button className="nav-item" type="button" disabled>
            <Trophy size={16} />
            Contests
            <span className="nav-tag">Soon</span>
          </button>
        )}
      </nav>

      {showFilters && (
        <div className="sidebar-section">
          <div className="section-title">
            <SlidersHorizontal size={14} />
            Filter
          </div>
          <div className="filter-group">
            {['all', 'easy', 'medium', 'hard'].map((level) => (
              <button
                key={level}
                type="button"
                className={`filter-pill ${difficulty === level ? 'active' : ''}`}
                onClick={() => onDifficultyChange && onDifficultyChange(level)}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="sidebar-section">
        <label className="section-title" htmlFor="search-input">
          <Search size={14} />
          Search
        </label>
        <div className="search-input">
          <Search size={14} />
          <input
            id="search-input"
            type="text"
            placeholder="Search by title"
            value={searchTerm}
            onChange={(event) => onSearchChange && onSearchChange(event.target.value)}
          />
        </div>
      </div>
    </aside>
  );
};
