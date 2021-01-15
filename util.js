var util = {}

// 사용자가 로그인이 되었는지 아닌지를 판단
util.isLoggedin = function(request, response, next){
    console.log('isLoggedin: ');

    if(request.isAuthenticated()){
        next();
    }else{
        request.flash('errors', {login: '로그인을 먼저 하세요.'});
        response.redirect('/user/login');
    }
}

// 어떠한 route에 접근권한이 없다고 판단된 경우에 호출
util.noPermission = function(request, response){
    console.log('noPermission: ');

    request.flash('errors', {login: '권한이 없습니다.'});
    request.logout();
    response.redirect('/user/login');
}

module.exports = util;