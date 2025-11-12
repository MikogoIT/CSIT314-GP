import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/Common/LanguageSwitcher';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: '',
    phone: '',
    organization: '',
    address: '',
    birthDate: '',
    emergencyContact: '',
    skills: [],
    adminCode: ''
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // 基础验证
    if (!formData.userType) {
      setError(t('auth.register.error.userType'));
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.register.error.passwordMismatch'));
      return;
    }
    
    if (formData.password.length < 6) {
      setError(t('auth.register.error.passwordTooShort'));
      return;
    }
    
    // 特殊验证已移除（不允许注册管理员）
    
    setIsLoading(true);
    
    const result = await register(formData);
    
    if (result.success) {
      // 注册成功后根据用户类型重定向
      switch (formData.userType) {
        case 'pin':
          navigate('/pin/dashboard');
          break;
        case 'csr':
          navigate('/csr/search');
          break;

        default:
          navigate('/');
      }
    } else {
      // 处理错误代码并显示相应的翻译信息
      let errorMessage = t('common.error');
      if (result.errorCode) {
        switch (result.errorCode) {
          case 'EMAIL_ALREADY_EXISTS':
            errorMessage = t('auth.register.error.emailExists');
            break;
          default:
            errorMessage = result.error || t('common.error');
        }
      } else {
        errorMessage = result.error || t('common.error');
      }
      setError(errorMessage);
    }
    
    setIsLoading(false);
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'skills') {
      if (checked) {
        setFormData(prev => ({
          ...prev,
          skills: [...prev.skills, value]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          skills: prev.skills.filter(skill => skill !== value)
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.userType) {
        setError(t('auth.register.error.requiredFields'));
        return;
      }
    }
    setError('');
    setStep(step + 1);
  };
  
  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };
  
  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-hero">
          <div className="hero-icon">📝</div>
          <h1 className="hero-title">{t('app.title')}</h1>
          <p className="hero-subtitle">开始您的志愿服务之旅</p>
        </div>
      </div>
      
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        <div className="auth-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 className="auth-title">加入CSR志愿者匹配系统</h2>
              <p className="auth-subtitle">创建您的账户，开始帮助他人</p>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
        
        {/* 步骤指示器 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          {[1, 2, 3].map(stepNum => (
            <div 
              key={stepNum}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: step >= stepNum ? 'var(--primary-color)' : 'var(--gray-300)',
                color: step >= stepNum ? 'white' : 'var(--gray-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 10px',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {stepNum}
            </div>
          ))}
        </div>
        
        {error && (
          <div className="message message-error">
            {error}
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {/* 第一步：基本信息 */}
          {step === 1 && (
            <>
              <div className="form-group">
                <label className="form-label required">姓名</label>
                <input 
                  type="text" 
                  name="name"
                  className="form-input"
                  placeholder="请输入您的真实姓名"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label required">邮箱</label>
                <input 
                  type="email" 
                  name="email"
                  className="form-input"
                  placeholder="请输入邮箱地址"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label required">用户类型</label>
                <select 
                  name="userType"
                  className="form-select"
                  value={formData.userType}
                  onChange={handleChange}
                  required
                >
                  <option value="">选择您的身份</option>
                  <option value="pin">Person-In-Need (PIN) - 需要帮助的个人</option>
                  <option value="csr">CSR代表 - 企业志愿者</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">手机号码</label>
                <input 
                  type="tel" 
                  name="phone"
                  className="form-input"
                  placeholder="请输入手机号码"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              
              <button type="button" className="btn btn-primary btn-full" onClick={nextStep}>
                下一步 →
              </button>
            </>
          )}
          
          {/* 第二步：密码设置 */}
          {step === 2 && (
            <>
              <div className="form-group">
                <label className="form-label required">密码</label>
                <input 
                  type="password" 
                  name="password"
                  className="form-input"
                  placeholder="至少6位密码"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label required">确认密码</label>
                <input 
                  type="password" 
                  name="confirmPassword"
                  className="form-input"
                  placeholder="再次输入密码"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">地址</label>
                <input 
                  type="text" 
                  name="address"
                  className="form-input"
                  placeholder="您的常住地址"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
              
              {/* 管理员验证码 */}

              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={prevStep}>
                  ← 上一步
                </button>
                <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={nextStep}>
                  下一步 →
                </button>
              </div>
            </>
          )}
          
          {/* 第三步：角色特定信息 */}
          {step === 3 && (
            <>
              {/* PIN用户特定信息 */}
              {formData.userType === 'pin' && (
                <>
                  <div className="form-group">
                    <label className="form-label">出生日期</label>
                    <input 
                      type="date" 
                      name="birthDate"
                      className="form-input"
                      value={formData.birthDate}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">紧急联系人</label>
                    <input 
                      type="text" 
                      name="emergencyContact"
                      className="form-input"
                      placeholder="紧急联系人姓名和电话"
                      value={formData.emergencyContact}
                      onChange={handleChange}
                    />
                  </div>
                </>
              )}
              
              {/* CSR用户特定信息 */}
              {formData.userType === 'csr' && (
                <>
                  <div className="form-group">
                    <label className="form-label">所属机构</label>
                    <input 
                      type="text" 
                      name="organization"
                      className="form-input"
                      placeholder="公司或组织名称"
                      value={formData.organization}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">技能专长</label>
                    <div className="form-checkbox-group">
                      {[
                        { value: 'medical', label: '医疗护理' },
                        { value: 'transport', label: '交通出行' },
                        { value: 'technology', label: '技术支持' },
                        { value: 'education', label: '教育培训' },
                        { value: 'household', label: '家务服务' },
                        { value: 'companion', label: '陪伴关怀' }
                      ].map(skill => (
                        <label key={skill.value} className="form-checkbox">
                          <input
                            type="checkbox"
                            name="skills"
                            value={skill.value}
                            checked={formData.skills.includes(skill.value)}
                            onChange={handleChange}
                          />
                          <span>{skill.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
              

              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={prevStep}>
                  ← 上一步
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={isLoading}
                >
                  {isLoading && <span className="loading-spinner"></span>}
                  {isLoading ? '注册中...' : '完成注册'}
                </button>
              </div>
            </>
          )}
        </form>
        
        <div className="auth-links">
          <p className="auth-link">
            已有账号？ <Link to="/login">立即登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;