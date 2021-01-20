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

// res.locals에 getPostQueryString함수를 추가
util.getPostQueryString = function(request, response, next){
    response.locals.getPostQueryString = function(isAppended=false, overwrites={}){
        var queryString ='';
        var queryArray = [];
        var page = overwrites.page?overwrites.page:(request.query.page?request.query.page:'');
        var limit = overwrites.limit?overwrites.limit:(request.query.limit?request.query.limit:'');
        // overwrites에 limit가 있으면 그대로 사용하고 없으면 request.query에서 limit를 가져와 사용

        if(page) queryArray.push('page=' + page);
        if(limit) queryArray.push('limit=' + limit);

        if(queryArray.length > 0) queryString = (isAppended?'&':'?') + queryArray.join('&');

        return queryString;
    }
    next();
}

module.exports = util;