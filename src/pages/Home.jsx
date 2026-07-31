import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import JobCard from '../components/JobCard';
import JobFilter from '../components/JobFilter';
import { JOBS, CATEGORIES } from '../data/jobs';
import '../styles/home.css';

const EMPTY_FILTERS = { types: [], categories: [], experience: [], locations: [] };

// ── Experience filter helper ──
function matchesExperience(job, expFilters) {
  if (!expFilters.length) return true;
  const exp = job.experience.toLowerCase();
  return expFilters.some(f => {
    if (f === 'fresher') return exp.includes('0') || exp.includes('fresh');
    if (f === '0-2')     return exp.match(/0[–-]2/) || exp.match(/1[–-]2/);
    if (f === '2-5')     return exp.match(/2[–-][345]/) || exp.match(/3[–-]/);
    if (f === '5+')      return exp.includes('5') || exp.includes('6');
    return false;
  });
}

export default function Home() {
  const [searchTitle, setSearchTitle] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [activeCategory, setActiveCategory] = useState(null);
  const [sortBy, setSortBy] = useState('recent');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [allJobs, setAllJobs] = useState(JOBS);

  // Fetch dynamic jobs from API
  React.useEffect(() => {
    async function loadApiJobs() {
      try {
        const res = await fetch('/api/jobs');
        if (res.ok) {
          const apiJobs = await res.json();
          if (apiJobs && apiJobs.length > 0) {
            const apiJobIds = new Set(apiJobs.map(j => j.id));
            const remainingDefault = JOBS.filter(j => !apiJobIds.has(j.id));
            setAllJobs([...apiJobs, ...remainingDefault]);
          }
        }
      } catch (err) {
        console.warn('Could not load jobs from API, falling back to local dataset.', err.message);
      }
    }
    loadApiJobs();
  }, []);

  // ── Active filter count ──
  const activeFilterCount = useMemo(() =>
    Object.values(filters).flat().length + (activeCategory ? 1 : 0),
    [filters, activeCategory]
  );

  // ── Filtered & Sorted Jobs ──
  const filteredJobs = useMemo(() => {
    let result = allJobs;

    // Search by title
    if (searchTitle.trim()) {
      const q = searchTitle.toLowerCase();
      result = result.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.department.toLowerCase().includes(q) ||
        j.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Search by location
    if (searchLocation) {
      result = result.filter(j => j.location === searchLocation);
    }

    // Category chip
    if (activeCategory) {
      result = result.filter(j => j.category === activeCategory);
    }

    // Sidebar filters
    if (filters.types.length)      result = result.filter(j => filters.types.includes(j.type));
    if (filters.categories.length) result = result.filter(j => filters.categories.includes(j.category));
    if (filters.locations.length)  result = result.filter(j => filters.locations.includes(j.location));
    if (filters.experience.length) result = result.filter(j => matchesExperience(j, filters.experience));

    // Sort
    if (sortBy === 'recent') {
      result = [...result].sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
    } else if (sortBy === 'salary-high') {
      result = [...result].sort((a, b) => {
        const getMax = s => parseInt(s.replace(/[^0-9]/g, '').slice(-2)) || 0;
        return getMax(b.salary) - getMax(a.salary);
      });
    }

    return result;
  }, [searchTitle, searchLocation, filters, activeCategory, sortBy]);

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const handleClearAll = () => {
    setFilters(EMPTY_FILTERS);
    setActiveCategory(null);
    setSearchTitle('');
    setSearchLocation('');
  };

  const handlePopularSearch = (term) => {
    setSearchTitle(term);
  };

  return (
    <div className="page-wrapper">

      {/* ── Hero Section (Apna Style) ── */}
      <section className="hero" aria-label="Job Search">
        <div className="container">
          <div className="hero-content">

            <div className="hero-eyebrow">
              INDIA'S #1 JOB PLATFORM
            </div>

            <h1 className="hero-title">
              Your job search ends here
            </h1>

            <p className="hero-subtitle">
              Discover 50 lakh+ career opportunities across top companies and roles
            </p>

            {/* Unified 3-Segment Search Bar */}
            <form className="hero-search" onSubmit={handleSearch} role="search" aria-label="Search jobs">
              
              {/* Field 1: Title / Skill */}
              <div className="search-field">
                <span className="search-field-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search jobs by 'title', 'company'..."
                  value={searchTitle}
                  onChange={e => setSearchTitle(e.target.value)}
                  aria-label="Search by job title or skill"
                  id="job-search-input"
                />
              </div>
              
              <div className="search-divider" aria-hidden="true" />
              
              {/* Field 2: Experience Selector */}
              <div className="search-field">
                <span className="search-field-icon">💼</span>
                <select
                  value={filters.experience[0] || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setFilters(prev => ({ ...prev, experience: val ? [val] : [] }));
                  }}
                  aria-label="Experience dropdown"
                  id="experience-search-select"
                  style={{ color: filters.experience.length ? 'var(--color-text-primary)' : 'var(--color-text-disabled)' }}
                >
                  <option value="">Your Experience...</option>
                  <option value="fresher">Fresher / Any</option>
                  <option value="0-2">0 - 2 Years</option>
                  <option value="2-5">2 - 5 Years</option>
                  <option value="5+">5+ Years</option>
                </select>
              </div>

              <div className="search-divider" aria-hidden="true" />

              {/* Field 3: Location */}
              <div className="search-field">
                <span className="search-field-icon">📍</span>
                <select
                  value={searchLocation}
                  onChange={e => setSearchLocation(e.target.value)}
                  aria-label="Filter by location"
                  id="location-search-select"
                  style={{ color: searchLocation ? 'var(--color-text-primary)' : 'var(--color-text-disabled)' }}
                >
                  <option value="">Search for an area...</option>
                  <option value="Bhubaneswar, Odisha">Bhubaneswar</option>
                  <option value="Mumbai, Maharashtra">Mumbai</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Bengaluru, Karnataka">Bengaluru</option>
                  <option value="Pune, Maharashtra">Pune</option>
                  <option value="Hyderabad, Telangana">Hyderabad</option>
                  <option value="Chennai, Tamil Nadu">Chennai</option>
                  <option value="Ahmedabad, Gujarat">Ahmedabad</option>
                </select>
              </div>

              {/* Submit Button */}
              <button type="submit" className="search-btn" id="search-submit-btn">
                Search jobs
              </button>
            </form>

            {/* Popular Searches */}
            <div className="hero-popular" role="group" aria-label="Popular searches">
              <span className="hero-popular-label">Popular Searches:</span>
              {['Work From Home', 'Software Engineer', 'Marketing Manager', 'HRBP', 'Finance', 'Data Analyst'].map(term => (
                <button
                  key={term}
                  className="popular-tag"
                  onClick={() => handlePopularSearch(term)}
                  aria-label={`Search for ${term}`}
                >
                  {term}
                </button>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── Category Chips ── */}
      <section className="categories-section" aria-label="Job categories">
        <div className="container">
          <div className="categories-grid" role="group" aria-label="Filter by department">
            <button
              className={`category-chip${!activeCategory ? ' active' : ''}`}
              onClick={() => setActiveCategory(null)}
              id="cat-all"
              aria-pressed={!activeCategory}
            >
              <span className="category-chip-icon">💼</span>
              All Jobs
              <span className="category-chip-count">{JOBS.length}</span>
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`category-chip${activeCategory === cat.id ? ' active' : ''}`}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                id={`cat-chip-${cat.id}`}
                aria-pressed={activeCategory === cat.id}
              >
                <span className="category-chip-icon">{cat.icon}</span>
                {cat.label}
                <span className="category-chip-count">{cat.count}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <main className="main-content" id="job-listings">
        <div className="container">

          {/* Mobile Filter Toggle */}
          <div style={{ display: 'none', marginBottom: 'var(--space-4)' }} className="mobile-filter-row">
            <button
              className="btn btn-outline-navy btn-sm"
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              id="mobile-filter-toggle"
              aria-expanded={mobileFilterOpen}
            >
              🔍 Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
          </div>

          <div className="content-grid">

            {/* ── Filter Sidebar ── */}
            <div className={mobileFilterOpen ? 'mobile-open' : ''}>
              <JobFilter
                filters={filters}
                onChange={setFilters}
                onClear={() => setFilters(EMPTY_FILTERS)}
                activeCount={activeFilterCount}
              />
            </div>

            {/* ── Jobs Panel ── */}
            <section className="jobs-panel" aria-label="Job listings">

              {/* Header Row */}
              <div className="jobs-header">
                <p className="jobs-count">
                  Showing <strong>{filteredJobs.length}</strong> of {allJobs.length} openings
                  {activeFilterCount > 0 && (
                    <button
                      onClick={handleClearAll}
                      style={{ marginLeft: '8px', color: 'var(--color-primary)', cursor: 'pointer', background: 'none', border: 'none', fontSize: 'inherit', fontWeight: '600' }}
                    >
                      — Clear all filters
                    </button>
                  )}
                </p>
                <div className="jobs-sort">
                  <span>Sort by:</span>
                  <select
                    className="sort-select"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    aria-label="Sort jobs by"
                    id="sort-select"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="salary-high">Highest Salary</option>
                  </select>
                </div>
              </div>

              {/* Jobs List */}
              {filteredJobs.length > 0 ? (
                <div className="jobs-list" role="list" aria-label="Available jobs">
                  {filteredJobs.map((job, idx) => (
                    <div key={job.id} role="listitem" style={{ animationDelay: `${idx * 0.05}s` }}>
                      <JobCard job={job} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-results" role="status" aria-live="polite">
                  <div className="no-results-emoji">🔍</div>
                  <h3>No jobs found</h3>
                  <p>Try adjusting your search or filters to find more openings.</p>
                  <button
                    className="btn btn-primary"
                    onClick={handleClearAll}
                    style={{ marginTop: '1.5rem', display: 'inline-flex' }}
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

    </div>
  );
}
