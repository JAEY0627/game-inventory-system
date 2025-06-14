// Firebase 설정
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyBOikXWOMg3uj-f_kdnXh394sVDHMtboaE",
    authDomain: "game-inventory-system.firebaseapp.com",
    projectId: "game-inventory-system",
    storageBucket: "game-inventory-system.appspot.com",
    messagingSenderId: "930027493877",
    appId: "1:930027493877:web:87974d860dae032fbea8bc"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export let currentUser = null;

// 권한 체크 함수들
export function isAnonymousUser() {
    return currentUser && currentUser.isAnonymous;
}

export function hasEditPermission() {
    return currentUser && !currentUser.isAnonymous;
}

// UI 권한 제어 함수
function updateUIPermissions() {
    const isAnonymous = isAnonymousUser();
    
    // 버튼들 숨기기/보이기
    const editButtons = document.querySelectorAll('.btn-primary, .btn-success, .btn-warning, .btn-danger');
    const addButtons = document.querySelectorAll('[onclick*="Modal"], [onclick*="parseQuickInput"]');
    
    editButtons.forEach(button => {
        if (button.textContent.includes('추가') || 
            button.textContent.includes('수정') || 
            button.textContent.includes('삭제') ||
            button.textContent.includes('빠른 입력') ||
            button.textContent.includes('자동 추가')) {
            
            if (isAnonymous) {
                button.style.display = 'none';
            } else {
                button.style.display = 'inline-block';
            }
        }
    });
    
    // 사용자 정보 표시 업데이트
    const userEmailElement = document.getElementById('userEmail');
    if (userEmailElement && currentUser) {
        if (isAnonymous) {
            userEmailElement.innerHTML = '🔍 게스트 사용자 <small style="color: #999;">(읽기 전용)</small>';
        } else {
            userEmailElement.textContent = currentUser.email;
        }
    }
    
    // 게스트 사용자에게 정식 로그인 버튼 추가
    updateGuestLoginButton();
}

// 게스트 로그인 버튼 업데이트
function updateGuestLoginButton() {
    const userInfo = document.querySelector('.user-info');
    const existingUpgradeBtn = document.getElementById('upgradeLoginBtn');
    
    if (isAnonymousUser() && !existingUpgradeBtn && userInfo) {
        const upgradeBtn = document.createElement('button');
        upgradeBtn.id = 'upgradeLoginBtn';
        upgradeBtn.className = 'btn btn-primary';
        upgradeBtn.style.cssText = 'padding: 8px 12px; font-size: 12px; margin-right: 10px;';
        upgradeBtn.textContent = '정식 로그인';
        upgradeBtn.onclick = () => {
            if (confirm('정식 로그인 페이지로 이동하시겠습니까? (현재 세션이 종료됩니다)')) {
                signOut(auth).then(() => {
                    window.location.href = 'index.html';
                });
            }
        };
        userInfo.insertBefore(upgradeBtn, userInfo.firstChild);
    } else if (!isAnonymousUser() && existingUpgradeBtn) {
        existingUpgradeBtn.remove();
    }
}

// 인증 상태 확인
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        
        // 캐시 저장 (익명 사용자도 포함)
        const userData = {
            uid: user.uid,
            email: user.email || 'anonymous',
            isAnonymous: user.isAnonymous
        };
        sessionStorage.setItem('currentUser', JSON.stringify(userData));
        
        // UI 업데이트
        setTimeout(() => {
            updateUIPermissions();
            loadPageData();
        }, 100);
        
    } else {
        // 로그아웃 시 캐시 제거
        sessionStorage.removeItem('currentUser');
        currentUser = null;
        
        // 로그인되지 않은 사용자는 로그인 페이지로 리다이렉트
        if (!window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
    }
});

// 권한이 필요한 작업 체크
export function checkEditPermission(actionName = '이 기능') {
    if (!hasEditPermission()) {
        showNotification(`${actionName}은 정식 로그인 후 이용 가능합니다.`, 'error');
        return false;
    }
    return true;
}

// 페이지별 데이터 로드 함수
function loadPageData() {
    setTimeout(() => {
        if (typeof loadSalesData === 'function') {
            loadSalesData();
        }
        if (typeof loadInvestmentData === 'function') {
            loadInvestmentData();
        }
        if (typeof loadInventoryData === 'function') {
            loadInventoryData();
        }
    }, 50);
}

// 로그아웃 기능
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const message = isAnonymousUser() ? 
                '게스트 세션을 종료하시겠습니까?' : 
                '로그아웃 하시겠습니까?';
                
            if (confirm(message)) {
                sessionStorage.removeItem('currentUser');
                signOut(auth).then(() => {
                    window.location.href = 'index.html';
                });
            }
        });
    }
});

// 알림 메시지 함수
export function showNotification(message, type = 'success') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// 모달 외부 클릭시 닫기
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
});

// 현재 페이지에 따라 네비게이션 활성화
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
});