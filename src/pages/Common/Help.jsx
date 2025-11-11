// Help页面
import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Layout/Navbar';
import '../../styles/help.css';

const Help = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <div className="help-page">
      <Navbar userType={user?.userType} user={user} />
      
      <div className="container">
        <div className="help-content">
          <div className="help-header">
            <h1 className="help-title">{t('help.title')}</h1>
            <p className="help-subtitle">{t('help.subtitle')}</p>
          </div>

          <div className="help-sections">
            {/* PIN用户帮助 */}
            <div className="help-section">
              <h2 className="section-title">
                <span className="section-icon">🙋</span>
                {t('help.pin.title')}
              </h2>
              <div className="help-cards">
                <div className="help-card">
                  <h3>{t('help.pin.createRequest.title')}</h3>
                  <p>{t('help.pin.createRequest.description')}</p>
                  <ul>
                    <li>{t('help.pin.createRequest.step1')}</li>
                    <li>{t('help.pin.createRequest.step2')}</li>
                    <li>{t('help.pin.createRequest.step3')}</li>
                    <li>{t('help.pin.createRequest.step4')}</li>
                  </ul>
                </div>
                
                <div className="help-card">
                  <h3>{t('help.pin.manageRequests.title')}</h3>
                  <p>{t('help.pin.manageRequests.description')}</p>
                  <ul>
                    <li>{t('help.pin.manageRequests.step1')}</li>
                    <li>{t('help.pin.manageRequests.step2')}</li>
                    <li>{t('help.pin.manageRequests.step3')}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CSR用户帮助 */}
            <div className="help-section">
              <h2 className="section-title">
                <span className="section-icon">🤝</span>
                {t('help.csr.title')}
              </h2>
              <div className="help-cards">
                <div className="help-card">
                  <h3>{t('help.csr.searchOpportunities.title')}</h3>
                  <p>{t('help.csr.searchOpportunities.description')}</p>
                  <ul>
                    <li>{t('help.csr.searchOpportunities.step1')}</li>
                    <li>{t('help.csr.searchOpportunities.step2')}</li>
                    <li>{t('help.csr.searchOpportunities.step3')}</li>
                  </ul>
                </div>
                
                <div className="help-card">
                  <h3>{t('help.csr.applyVolunteer.title')}</h3>
                  <p>{t('help.csr.applyVolunteer.description')}</p>
                  <ul>
                    <li>{t('help.csr.applyVolunteer.step1')}</li>
                    <li>{t('help.csr.applyVolunteer.step2')}</li>
                    <li>{t('help.csr.applyVolunteer.step3')}</li>
                  </ul>
                </div>
              </div>
            </div>



            {/* 常见问题 */}
            <div className="help-section">
              <h2 className="section-title">
                <span className="section-icon">❓</span>
                {t('help.faq.title')}
              </h2>
              <div className="faq-list">
                <div className="faq-item">
                  <h3>{t('help.faq.q1.question')}</h3>
                  <p>{t('help.faq.q1.answer')}</p>
                </div>
                
                <div className="faq-item">
                  <h3>{t('help.faq.q2.question')}</h3>
                  <p>{t('help.faq.q2.answer')}</p>
                </div>
                
                <div className="faq-item">
                  <h3>{t('help.faq.q3.question')}</h3>
                  <p>{t('help.faq.q3.answer')}</p>
                </div>
                
                <div className="faq-item">
                  <h3>{t('help.faq.q4.question')}</h3>
                  <p>{t('help.faq.q4.answer')}</p>
                </div>
              </div>
            </div>

            {/* 联系我们 */}
            <div className="help-section">
              <h2 className="section-title">
                <span className="section-icon">📞</span>
                {t('help.contact.title')}
              </h2>
              <div className="contact-info">
                <div className="contact-card">
                  <h3>{t('help.contact.support.title')}</h3>
                  <p>{t('help.contact.support.description')}</p>
                  <div className="contact-details">
                    <p>📧 support@csrvolunteer.com</p>
                    <p>📞 +65 1234 5678</p>
                    <p>🕐 {t('help.contact.support.hours')}</p>
                  </div>
                </div>
                
                <div className="contact-card">
                  <h3>{t('help.contact.feedback.title')}</h3>
                  <p>{t('help.contact.feedback.description')}</p>
                  <div className="contact-details">
                    <p>📧 feedback@csrvolunteer.com</p>
                    <p>💬 {t('help.contact.feedback.form')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;