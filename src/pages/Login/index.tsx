import React, { useEffect, useState } from 'react';
import { Slider, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { hashSHA256 } from '../../utils/crypto';
import { post } from '../../utils/request';
import './index.css';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberAccount, setRememberAccount] = useState(false);
    const [verificationSuccess, setVerificationSuccess] = useState(false);
    const [sliderValue, setSliderValue] = useState(0);
 

    const handleLogin = async () => {
        if (!username.trim()) {
            message.error('请输入账号');
            return;
        }
        if (!password.trim()) {
            message.error('请输入密码');
            return;
        }
        if (!verificationSuccess) {
            message.error('请先进行滑块验证');
            return;
        }
        // const passwordHash = await hashSHA256(password.trim());
        try {
            const res = await post<any>('/auth/manage-user-login', {
                username: username.trim(),
                password: password.trim(),
            });
            const accessToken = (res && (res as any).accessToken) || (res && (res as any).data && (res as any).data.accessToken)
            if (accessToken) {
                localStorage.setItem('token', accessToken)
                message.success('登录成功')
                navigate('/')
            } else {
                message.warning('登录成功，但未返回accessToken')
            }
            console.log('登录响应:', res);
        } catch (err: any) {
            const msg = err?.message || '登录请求失败';
            message.error(msg);
            console.error(err);
        }
    };

    const onSliderChange = (value: number) => {
        setSliderValue(value);
    };

    const onSliderAfterChange = (value: number) => {
        if (value >= 100) {
            setVerificationSuccess(true);
            message.success('验证成功');
        } else {
            // 未到达终点则复位
            setSliderValue(0);
        }
    };

    return (
        <div className="login-container">
            {/* 背景装饰 */}
            <div className="background-decoration"></div>
            
            {/* 主登录卡片 */}
            <div className="login-card">
                {/* Logo区域 */}
                <div className="logo-section">
                    <div className="logo-circle">
                        <div className="logo-icon"></div>
                    </div>
                    <h1 className="title">新车帮买管理后台</h1>
                    <p className="subtitle">智能管理，高效服务</p>
                </div>

                {/* 表单区域 */}
                <div className="form-section">
                    {/* 账号输入 */}
                    <div className="input-group">
                        <label className="input-label">账号</label>
                        <div className="input-wrapper">
                            <div className="input-icon user-icon"></div>
                            <input
                                type="text"
                                placeholder="请输入账号"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input-field"
                            />
                        </div>
                    </div>

                    {/* 密码输入 */}
                    <div className="input-group">
                        <label className="input-label">密码</label>
                        <div className="input-wrapper">
                            <div className="input-icon password-icon"></div>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="请输入密码"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <div className={`eye-icon ${showPassword ? 'eye-open' : 'eye-close'}`}></div>
                            </button>
                        </div>
                    </div>

                    {/* 验证码区域 */}
                    <div className="input-group">
                        <label className="input-label">验证</label>
                        {verificationSuccess ? (
                            <div className="verification-success">
                                <div className="success-icon"></div>
                                <span>验证成功</span>
                            </div>
                        ) : (
                            <div className="slider-verify">
                                <Slider
                                    value={sliderValue}
                                    onChange={onSliderChange}
                                    onAfterChange={onSliderAfterChange}
                                    tooltip={{ open: false }}
                                />
                                <div className="slider-tip">按住滑块，拖动到最右侧完成验证</div>
                                {(!verificationSuccess && sliderValue === 0) && (
                                    <div className="verify-warning">请先进行滑块验证</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 记住账号选项 */}
                    <div className="remember-section">
                        <label className="checkbox-wrapper">
                            <input
                                type="checkbox"
                                checked={rememberAccount}
                                onChange={(e) => setRememberAccount(e.target.checked)}
                                className="checkbox-input"
                            />
                            <span className="checkbox-custom"></span>
                            <span className="checkbox-label">记住账号</span>
                        </label>
                    </div>

                    {/* 登录按钮 */}
                    <button type="button" className="login-button" onClick={handleLogin}>
                        登 录
                    </button>
                </div>

                {/* 客服信息 */}
                <div className="customer-service">
                    遇到问题？联系客服 400-888-8888
                </div>
            </div>

            {/* 底部装饰 */}
            <div className="bottom-decoration"></div>

            {/* 页脚信息 */}
            <div className="footer">
                <p className="browser-tip">推荐使用Chrome、Firefox等浏览器访问</p>
                <p className="copyright">© 2023 新车帮买科技有限公司</p>
                <p className="icp">浙ICP备2024106990号</p>
            </div>
        </div>
    );
};

export default Login;