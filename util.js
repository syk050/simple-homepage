var util = {}

// 사용자가 로그인이 되었는지 아닌지를 판단
util.isLoggedin = function(request, response, next){
    console.log('isLoggedin: ');

    if(request.isAuthenticated()){
        console.log('다음');
        next();
    }else{
        console.log('로그인x');
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

        var serchType = overwrites.serchType?overwrites.serchType:(request.query.serchType?request.query.serchType:'')
        var serchText = overwrites.serchText?overwrites.serchText:(request.query.serchText?request.query.serchText:'')


        if(page) queryArray.push('page=' + page);
        if(limit) queryArray.push('limit=' + limit);
        if(serchType) queryArray.push('serchType=' + serchType);
        if(serchText) queryArray.push('serchText=' + serchText);

        if(queryArray.length > 0) queryString = (isAppended?'&':'?') + queryArray.join('&');

        return queryString;
    }
    next();
}

// 
util.convertToTrees = function(array, idFieldName, parentIdFieldName, childrenFieldName){
    /*
    array: tree구조로 변경할 array
    idFieldName: array의 member에서 id를 가지는 field의 이름을 받습니다.
    parentIdFieldName: array의 member에서 부모id를 가지는 field의 이름을 받습니다.
    childrenFieldName: 생성된 자식들을 넣을 field의 이름을 정하여 넣습니다.
    */
    var cloned = array.slice();

    for(var i=cloned.length-1; i>-1; i--){
        var parentId = cloned[i][parentIdFieldName];

        if(parentId){
            var filtered = array.filter(function(elem){
                return elem[idFieldName].toString() == parentId.toString();
            });

            if(filtered.length){
                var parent = filtered[0];

                if(parent[childrenFieldName]){
                    parent[childrenFieldName].push(cloned[i]);
                }else{
                    parent[childrenFieldName] = [cloned[i]];
                }
            }
            // i번째에 한개 제거
            cloned.splice(i, 1);
        }
    }

    return cloned;
} 

util.bytesToSize = function(bytes){
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if(bytes == 0) return '0Byte';
    
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

module.exports = util;