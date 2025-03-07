import React, { useContext, useEffect, useState } from 'react';
import { Card, Col, Row } from '@douyinfe/semi-ui';
import { API, showError, showNotice, timestamp2string } from '../../helpers';
import { StatusContext } from '../../context/Status';
import './HomePage.css';
import { Link } from 'react-router-dom';

const Home = () => {
  const [statusState] = useContext(StatusContext);
  const [homePageContentLoaded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isHovered2, setIsHovered2] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'auto' }}>
      <section style={{
        position: 'relative',
        minHeight: '100vh', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
        padding: '4rem 1rem'
      }}>
        <div className="background-animation"></div>
        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <h1 className="hero-title">Financial Embeddings API</h1>
          <p className="hero-description">
            Specialized embeddings for financial NLP, trained on SEC filings, 
            earnings calls, and market reports with domain-specific fine-tuning.
          </p>
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginTop: '1.5rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
            minwidth: '200px',
            fontSize: '1.1rem',
            fontweight: '500'
          }}>
            <Link to="/doc" className="cta-button" style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--finance-green)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '500',
              fontSize: '1rem',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              minWidth: '150px',
              boxShadow: isHovered ? '0 4px 8px rgba(0, 0, 0, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
              transform: isHovered ? 'translateY(-2px)' : 'none'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}>
                        Try Now
            </Link>
            <a href="https://huggingface.co/spaces/FinanceMTEB/FinMTEB" className="cta-button" style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--finance-green)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: '500',
                fontSize: '1rem',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                minWidth: '150px',
                boxShadow: isHovered2 ? '0 4px 8px rgba(0, 0, 0, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                transform: isHovered2 ? 'translateY(-2px)' : 'none'
              }}
              onMouseEnter={() => setIsHovered2(true)}
              onMouseLeave={() => setIsHovered2(false)}>
              Leaderboard
            </a>
          </div>
        </div>
      </section>


      <section className="features animate-on-scroll">
        <div className="container_footer">
          <div className="feature-card">
            <div className="feature-icon compliance"></div>
            <h3 style={{ marginBottom: '1rem', color: 'var(--openai-dark)' }}>State-of-the-Art Financial Embeddings</h3>
            <p style={{ color: 'var(--text-gray)' }}>
              Powered by Cutting-Edge AI Research and Engineering
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon financial-data"></div>
            <h3 style={{ marginBottom: '1rem', color: 'var(--openai-dark)' }}>Financial Document Understanding</h3>
            <p style={{ color: 'var(--text-gray)' }}>
              Optimized for 10-K/Q filings, earnings transcripts, and IBES estimates 
              with financial semantic understanding
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon market-trend"></div>
            <h3 style={{ marginBottom: '1rem', color: 'var(--openai-dark)' }}>Market Sentiment Analysis</h3>
            <p style={{ color: 'var(--text-gray)' }}>
              Encodes subtle sentiment shifts in analyst reports and 
              market commentaries
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Partial  */}
      <section id="testimonials" className="testimonials animate-on-scroll">
        <div className="container_footer">
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>What Our Users Say</h2>
          <div className="testimonial-grid">
            <div className="testimonial-card">
            <p>"FinEmbed has revolutionized how we process financial documents. The embeddings capture nuances that general models miss..."</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call-to-Action Partial  */}
      <section id="cta" className="cta animate-on-scroll">
        <div className="container_footer">
          <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Ready to Get Started?</h2>
          <p style={{ textAlign: 'center', marginBottom: '2rem' }}>Sign up now...</p>
          <div style={{ textAlign: 'center' }}>
          <Link  to="/doc"  style={{
        padding: '1rem 2rem',
        background: 'var(--finance-green)',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        textDecoration: 'none',
        fontSize: '1.1rem',
      }}>Sign Up</Link>
          </div>
        </div>
      </section>

      {/* Footer Partial 保持不变 */}
      <footer >
        <div className="container_footer">
          <p>© 2025 FinEmbed. All rights reserved.</p>
          <ul>
            <li><a href="#" style={{ color: '#6e6e80' }}>Privacy Policy</a></li>
            <li><a href="#" style={{ color: '#6e6e80' }}>Terms of Service</a></li>
            <li><a href="#" style={{ color: '#6e6e80' }}>Contact Us</a></li>
          </ul>
        </div>
      </footer>
    </div>
  );
};

export default Home;