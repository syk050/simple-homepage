var util = {}

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

// 정규식 검사
util.checkRegex = async function(data){
    console.log('check_regex 호출');

    var error = {}

    // regex는 / /안에 작성합니다
    // ^는 문자열의 시작 위치
    // .는 어떠한 문자열
    // {숫자1,숫자2}는 숫자1 이상, 숫자2 이하의 길이
    // $는 문자열의 끝 위치
    var idNameMatch = /^.{4,12}$/;
    if (data.id && !idNameMatch.exec(data.id)){
        error['id'] = 'ID는 4-12자여야 합니다.';
    }
    if (data.name && !idNameMatch.exec(data.name)){
        error['name'] = '닉네임은 4-12자여야 합니다.';
    }
    
    // 8-16자리 문자열 중에 숫자랑 영문자가 반드시 하나 이상 존재
    var pwMatch = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,12}$/
    if (data.password && !pwMatch.exec(data.password)){
        error['pw'] = '비밀번호는 숫자와 영문자가 포함되고 4-12자여야 합니다';
    }
    if (data.password != data.passwordConfirm){
        console.log('pw_not_matched');

        error['pwComfirm'] = '비밀번호가 일치하지 않습니다.';
    }

    
    // console.log(Object.keys(error).length);
    if(Object.keys(error).length == 0){
        return(null);
    }else{
        return(error);
    }
}

module.exports = util;