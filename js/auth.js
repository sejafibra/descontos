auth.onAuthStateChanged((user) => {
    if (user && ['atendente@sejafibra.net', 'supervisor@sejafibra.net', 'bioranss@gmail.com'].includes(user.email)) {
        if (typeof loadMaintenances === 'function') loadMaintenances();
    } else {
        window.location.href = 'login.html';
    }
});
