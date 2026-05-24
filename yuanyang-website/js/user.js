/* ============================================================
   用户系统 — user.js
   处理：登录 / 注册 / 头像上传 / 状态持久化（localStorage）
   用法：在每页 </body> 前引入 <script src="js/user.js"></script>
   ============================================================ */

(function () {
  'use strict';

  /* ---------- 常量 ---------- */
  const STORAGE_KEY  = 'yyzz_user';   // localStorage key
  const AVATAR_KEY   = 'yyzz_avatar'; // 用户自定义头像（DataURL）

  /* ---------- 工具 ---------- */
  function getUser () {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; }
    catch { return null; }
  }
  function setUser (u) { localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); }
  function clearUser () { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(AVATAR_KEY); }

  /* ---------- 注入弹窗 HTML（仅一次） ---------- */
  function injectModal () {
    if (document.getElementById('userModal')) return;

    const html = `
<!-- 用户弹窗遮罩 -->
<div id="userModal" style="
  display:none; position:fixed; inset:0; z-index:9999;
  background:rgba(0,0,0,0.45); backdrop-filter:blur(4px);
  justify-content:center; align-items:center;">
  <div id="userModalBox" style="
    background:#fff; border-radius:20px; width:340px; max-width:92vw;
    padding:36px 28px 28px; position:relative;
    box-shadow:0 20px 60px rgba(0,0,0,0.18); animation: fadeUp 0.25s ease;">
    <button onclick="UserModule.closeModal()" style="
      position:absolute; top:14px; right:18px; background:none; border:none;
      font-size:22px; color:#aaa; cursor:pointer; line-height:1;">×</button>

    <!-- 未登录：登录/注册表单 -->
    <div id="userNotLogin">
      <div style="text-align:center; margin-bottom:24px;">
        <div style="font-size:20px; font-weight:700; color:#1a4a2e;">欢迎来到源养智助</div>
        <div style="font-size:13px; color:#999; margin-top:6px;">登录后体验完整功能</div>
      </div>
      <div id="userFormBox">
        <!-- 登录表单 -->
        <div id="formLogin">
          <div style="margin-bottom:16px;">
            <input id="loginUser" type="text" placeholder="用户名" style="width:100%;padding:12px 14px;border:1.5px solid #ddd;border-radius:10px;font-size:14px;outline:none;box-sizing:border-box;" onfocus="this.style.borderColor='#2d6a4f'" onblur="this.style.borderColor='#ddd'">
          </div>
          <div style="margin-bottom:22px;">
            <input id="loginPass" type="password" placeholder="密码" style="width:100%;padding:12px 14px;border:1.5px solid #ddd;border-radius:10px;font-size:14px;outline:none;box-sizing:border-box;" onfocus="this.style.borderColor='#2d6a4f'" onblur="this.style.borderColor='#ddd'">
          </div>
          <button onclick="UserModule.doLogin()" style="width:100%;padding:13px;border:none;border-radius:10px;background:linear-gradient(135deg,#1a4a2e,#2d6a4f);color:#fff;font-size:15px;font-weight:600;cursor:pointer;">登 录</button>
          <div style="text-align:center;margin-top:16px;font-size:13px;color:#888;">
            还没有账号？<a href="javascript:;" onclick="UserModule.showRegister()" style="color:#2d6a4f;font-weight:600;">立即注册</a>
          </div>
        </div>
        <!-- 注册表单（默认隐藏） -->
        <div id="formRegister" style="display:none;">
          <div style="margin-bottom:14px;">
            <input id="regUser" type="text" placeholder="用户名" style="width:100%;padding:12px 14px;border:1.5px solid #ddd;border-radius:10px;font-size:14px;outline:none;box-sizing:border-box;" onfocus="this.style.borderColor='#2d6a4f'" onblur="this.style.borderColor='#ddd'">
          </div>
          <div style="margin-bottom:14px;">
            <input id="regEmail" type="email" placeholder="邮箱（选填）" style="width:100%;padding:12px 14px;border:1.5px solid #ddd;border-radius:10px;font-size:14px;outline:none;box-sizing:border-box;" onfocus="this.style.borderColor='#2d6a4f'" onblur="this.style.borderColor='#ddd'">
          </div>
          <div style="margin-bottom:22px;">
            <input id="regPass" type="password" placeholder="密码（至少6位）" style="width:100%;padding:12px 14px;border:1.5px solid #ddd;border-radius:10px;font-size:14px;outline:none;box-sizing:border-box;" onfocus="this.style.borderColor='#2d6a4f'" onblur="this.style.borderColor='#ddd'">
          </div>
          <button onclick="UserModule.doRegister()" style="width:100%;padding:13px;border:none;border-radius:10px;background:linear-gradient(135deg,#1a4a2e,#2d6a4f);color:#fff;font-size:15px;font-weight:600;cursor:pointer;">注 册</button>
          <div style="text-align:center;margin-top:16px;font-size:13px;color:#888;">
            已有账号？<a href="javascript:;" onclick="UserModule.showLogin()" style="color:#2d6a4f;font-weight:600;">返回登录</a>
          </div>
        </div>
      </div>
    </div>

    <!-- 已登录：用户信息面板 -->
    <div id="userLoggedIn" style="display:none; text-align:center;">
      <div style="margin-bottom:18px;">
        <img id="modalAvatar" src="" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid #2d6a4f;background:#eee;">
      </div>
      <div id="modalUsername" style="font-size:18px;font-weight:700;color:#1a4a2e;margin-bottom:6px;"></div>
      <div id="modalEmail" style="font-size:13px;color:#999;margin-bottom:22px;"></div>
      <button onclick="UserModule.triggerAvatarUpload()" style="padding:10px 24px;border:1.5px solid #2d6a4f;background:#fff;color:#2d6a4f;border-radius:8px;font-size:14px;cursor:pointer;margin-bottom:12px;margin-right:8px;">更换头像</button>
      <button onclick="UserModule.doLogout()" style="padding:10px 24px;border:none;background:rgba(231,76,60,0.1);color:#e74c3c;border-radius:8px;font-size:14px;cursor:pointer;margin-bottom:12px;">退出登录</button>
      <input type="file" id="avatarFileInput" accept="image/*" style="display:none;" onchange="UserModule.handleAvatarUpload(event)">
    </div>
  </div>
</div>
<style>
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
</style>`;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  /* ---------- 公开方法 ---------- */
  /* 获取当前登录用户名（无登录返回 null） */
  function getCurrentUser () {
    const u = getUser();
    return u ? u.username : null;
  }

  window.UserModule = {
    getCurrentUser: getCurrentUser,
    /* 打开弹窗 */
    openModal () {
      injectModal();
      const user = getUser();
      document.getElementById('userNotLogin').style.display = user ? 'none' : 'block';
      document.getElementById('userLoggedIn').style.display  = user ? 'block' : 'none';
      if (user) this._fillProfile(user);
      document.getElementById('userModal').style.display = 'flex';
    },

    /* 关闭弹窗 */
    closeModal () {
      const m = document.getElementById('userModal');
      if (m) m.style.display = 'none';
    },

    /* 切换到注册 */
    showRegister () {
      document.getElementById('formLogin').style.display = 'none';
      document.getElementById('formRegister').style.display = 'block';
    },

    /* 切换到登录 */
    showLogin () {
      document.getElementById('formRegister').style.display = 'none';
      document.getElementById('formLogin').style.display = 'block';
    },

    /* 登录 */
    doLogin () {
      const name = document.getElementById('loginUser').value.trim();
      const pass = document.getElementById('loginPass').value;
      if (!name || !pass) { alert('请填写用户名和密码'); return; }
      const saved = JSON.parse(localStorage.getItem('yyzz_users') || '{}');
      if (!saved[name] || saved[name].password !== pass) { alert('用户名或密码错误'); return; }
      setUser({ username: name, email: saved[name].email || '', loggedInAt: Date.now() });
      this.closeModal();
      this.updateAvatarBtn();
      alert('登录成功，欢迎回来 ' + name + '！');
    },

    /* 注册 */
    doRegister () {
      const name = document.getElementById('regUser').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const pass  = document.getElementById('regPass').value;
      if (!name || !pass) { alert('请填写用户名和密码'); return; }
      if (pass.length < 6)  { alert('密码至少需要6位'); return; }
      const saved = JSON.parse(localStorage.getItem('yyzz_users') || '{}');
      if (saved[name]) { alert('用户名已存在'); return; }
      saved[name] = { password: pass, email: email, createdAt: Date.now() };
      localStorage.setItem('yyzz_users', JSON.stringify(saved));
      setUser({ username: name, email: email, loggedInAt: Date.now() });
      this.closeModal();
      this.updateAvatarBtn();
      alert('注册成功，欢迎加入源养智助！');
    },

    /* 退出 */
    doLogout () {
      clearUser();
      this.closeModal();
      this.updateAvatarBtn();
      alert('已退出登录');
    },

    /* 触发头像上传 */
    triggerAvatarUpload () { document.getElementById('avatarFileInput').click(); },

    /* 处理头像上传 */
    handleAvatarUpload (e) {
      const file = e.target.files[0]; if (!file) return;
      if (file.size > 2 * 1024 * 1024) { alert('图片不能超过2MB'); return; }
      const reader = new FileReader();
      reader.onload = function (ev) {
        localStorage.setItem(AVATAR_KEY, ev.target.result);
        UserModule._fillProfile(getUser());
        UserModule.updateAvatarBtn();
      };
      reader.readAsDataURL(file);
    },

    /* 填充已登录面板 */
    _fillProfile (user) {
      const avatar = localStorage.getItem(AVATAR_KEY);
      document.getElementById('modalAvatar').src = avatar || 'assets/yonghu.png';
      document.getElementById('modalUsername').textContent = user.username;
      document.getElementById('modalEmail').textContent   = user.email || '暂无邮箱';
    },

    /* 更新导航栏头像按钮显示 */
    updateAvatarBtn () {
      const btn = document.getElementById('navAvatarBtn');
      if (!btn) return;
      const user   = getUser();
      const avatar = localStorage.getItem(AVATAR_KEY);
      if (user && avatar) {
        btn.innerHTML = `<img src="${avatar}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid #2d6a4f;">`;
      } else if (user) {
        btn.innerHTML = `<img src="assets/yonghu.png" style="width:20px;height:20px;opacity:0.7;">`;
      } else {
        btn.innerHTML = `<img src="assets/yonghu.png" style="width:20px;height:20px;opacity:0.7;">`;
      }
    }
  };

  /* ---------- 点击遮罩关闭 ---------- */
  document.addEventListener('click', function (e) {
    const modal = document.getElementById('userModal');
    if (modal && e.target === modal) window.UserModule.closeModal();
  });

  /* ---------- 页面加载后初始化头像按钮 ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { window.UserModule.updateAvatarBtn(); });
  } else {
    window.UserModule.updateAvatarBtn();
  }

})();
