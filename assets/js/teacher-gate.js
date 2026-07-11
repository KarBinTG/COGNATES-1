(function () {
  "use strict";

  var STORAGE_KEY = "cognates-teacher-access:v1";
  var EXPECTED_HASH = "08252ad548b7f73db9467e74a7b742df7e22d18bf62856cbe08836f4f40aa3c2";
  var modalRoot = null;

  function isTeacherPage() {
    return document.documentElement.hasAttribute("data-teacher-version");
  }

  function hasTeacherAccess() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "granted";
    } catch (error) {
      return false;
    }
  }

  function grantTeacherAccess() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "granted");
    } catch (error) {
      /* The current navigation can still continue after a valid login. */
    }
  }

  function normalizeUsername(value) {
    return String(value || "").trim().toLowerCase();
  }

  function bytesToHex(buffer) {
    return Array.prototype.map
      .call(new Uint8Array(buffer), function (byte) {
        return byte.toString(16).padStart(2, "0");
      })
      .join("");
  }

  function sha256(value) {
    var encoder = new TextEncoder();
    return crypto.subtle.digest("SHA-256", encoder.encode(value)).then(bytesToHex);
  }

  function injectStyles() {
    if (document.getElementById("teacher-gate-styles")) return;
    var style = document.createElement("style");
    style.id = "teacher-gate-styles";
    style.textContent = [
      "html.teacher-checking body{visibility:hidden}",
      "html.teacher-locked body>:not(.teacher-modal-root){filter:blur(8px);pointer-events:none;user-select:none}",
      "html.teacher-locked .chassis-cursor{display:none!important}",
      "html.teacher-locked body.chassis-cursor-active,html.teacher-locked body.chassis-cursor-active *{cursor:auto!important}",
      ".teacher-modal-root{position:fixed;inset:0;z-index:2147483200;display:grid;place-items:center;padding:20px;background:rgba(5,6,10,.9);backdrop-filter:blur(12px);visibility:visible!important}",
      ".teacher-modal-root,.teacher-modal-root *{cursor:auto!important}",
      ".teacher-card{width:min(430px,100%);background:#14151b;color:#eceaf0;border:1px solid #343746;border-radius:8px;box-shadow:0 24px 80px rgba(0,0,0,.48);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden}",
      ".teacher-card__bar{height:4px;background:linear-gradient(90deg,#7b2cbf,#e63946,#f4a261)}",
      ".teacher-card__body{padding:24px}",
      ".teacher-card h2{font-size:22px;line-height:1.2;margin:0 0 8px;font-weight:800;letter-spacing:0}",
      ".teacher-card p{font-size:14px;line-height:1.55;margin:0 0 18px;color:#aaaabb}",
      ".teacher-field{display:block;margin:0 0 14px}",
      ".teacher-field span{display:block;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9090a4;margin-bottom:7px}",
      ".teacher-field input{width:100%;height:44px;border-radius:8px;border:1px solid #383b4b;background:#0d0e13;color:#fff;padding:0 12px;font:15px/1.2 Inter,system-ui,sans-serif;outline:none;cursor:text!important}",
      ".teacher-field input:focus{border-color:#f4a261;box-shadow:0 0 0 3px rgba(244,162,97,.18)}",
      ".teacher-error{min-height:20px;margin:2px 0 14px;color:#ff8a92;font-size:13px}",
      ".teacher-actions{display:flex;gap:10px;justify-content:flex-end}",
      ".teacher-button{height:42px;border:0;border-radius:8px;padding:0 16px;font:700 14px/1 Inter,system-ui,sans-serif;cursor:pointer!important}",
      ".teacher-button.primary{background:#f4a261;color:#111}",
      ".teacher-button.primary:hover{background:#ffc083}",
      ".teacher-button.secondary{background:#262936;color:#dedce6}",
      ".teacher-button.secondary:hover{background:#323544}",
      "@media(max-width:520px){.teacher-card__body{padding:20px}.teacher-actions{flex-direction:column-reverse}.teacher-button{width:100%}}"
    ].join("");
    document.head.appendChild(style);
  }

  function removeModal() {
    if (modalRoot) modalRoot.remove();
    modalRoot = null;
  }

  function hideLockClasses() {
    document.documentElement.classList.remove("teacher-locked");
    document.documentElement.classList.remove("teacher-checking");
  }

  function showTeacherLogin(options) {
    injectStyles();
    removeModal();

    var opts = options || {};
    var root = document.createElement("div");
    root.className = "teacher-modal-root";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "teacher-login-title");
    root.innerHTML =
      '<form class="teacher-card">' +
      '<div class="teacher-card__bar"></div>' +
      '<div class="teacher-card__body">' +
      '<h2 id="teacher-login-title">Teacher Access</h2>' +
      '<p>Enter teacher credentials to open the instructor version.</p>' +
      '<label class="teacher-field"><span>Username</span><input name="username" autocomplete="username" required></label>' +
      '<label class="teacher-field"><span>Password</span><input name="password" type="password" autocomplete="current-password" required></label>' +
      '<div class="teacher-error" aria-live="polite"></div>' +
      '<div class="teacher-actions">' +
      (opts.allowCancel ? '<button class="teacher-button secondary" type="button" data-teacher-cancel>Cancel</button>' : "") +
      '<button class="teacher-button primary" type="submit">Continue</button>' +
      "</div>" +
      "</div>" +
      "</form>";

    modalRoot = root;
    document.body.appendChild(root);
    document.documentElement.classList.add("teacher-locked");
    document.documentElement.classList.remove("teacher-checking");

    var form = root.querySelector("form");
    var username = root.querySelector('input[name="username"]');
    var password = root.querySelector('input[name="password"]');
    var error = root.querySelector(".teacher-error");
    var cancel = root.querySelector("[data-teacher-cancel]");

    username.focus();

    if (cancel) {
      cancel.addEventListener("click", function () {
        removeModal();
        hideLockClasses();
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      error.textContent = "";

      sha256(normalizeUsername(username.value) + ":" + String(password.value || ""))
        .then(function (hash) {
          if (hash !== EXPECTED_HASH) {
            error.textContent = "Invalid teacher username or password.";
            password.value = "";
            password.focus();
            return;
          }

          grantTeacherAccess();
          removeModal();
          hideLockClasses();

          if (opts.redirectTo) {
            window.location.href = opts.redirectTo;
          }
        })
        .catch(function () {
          error.textContent = "This browser cannot verify credentials.";
        });
    });
  }

  function teacherIndexUrl() {
    return "COGNATES-6%20v.Teacher/index.html";
  }

  document.addEventListener(
    "keydown",
    function (event) {
      if (event.ctrlKey && event.shiftKey && String(event.key).toLowerCase() === "m") {
        event.preventDefault();
        event.stopPropagation();
        if (hasTeacherAccess()) {
          window.location.href = teacherIndexUrl();
        } else {
          showTeacherLogin({ allowCancel: true, redirectTo: teacherIndexUrl() });
        }
      }
    },
    true
  );

  document.addEventListener("DOMContentLoaded", function () {
    if (!isTeacherPage()) return;

    if (hasTeacherAccess()) {
      hideLockClasses();
      return;
    }

    showTeacherLogin({ allowCancel: false });
  });
})();
