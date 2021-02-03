const indexCtrl = {};

const pool = require('../database');

// list
indexCtrl.renderIndex = (req, res) => {
    console.log('indexCtrl.renderIndex');

    let page = Math.max(1, parseInt(req.query.page));
    let limit = Math.max(1, parseInt(req.query.limit));
    page = !isNaN(page)?page:1;
    limit = !isNaN(limit)?limit:5;
    
    let searchQuery = createSearchQuery(req.query);

    let skip = (page-1) * limit;

    const countSql = 'SELECT COUNT(*) AS count FROM board ?;';
    // const countSqlm = pool.format(countSql, searchQuery);
    
    let result = await pool.query(countSql, searchQuery);
    let count = result[0].count;
    let maxPage = Math.ceil(count/limit);

    const searchSql = 'SELECT * FROM board ? order by num DESC LIMIT ? OFFSET ?;';
    result = await pool.query(searchSql, [searchQuery, limit, skip]);
    let post = result;

    res.render('home/index', {
        post: post,
        currentPage: page,
        maxPage: maxPage,
        limit: limit,
        searchType: req.query.searchType,
        searchText: req.query.searchText
    });
};

module.exports = indexCtrl;

function createSearchQuery(queries) {
    var searchQuery = '';
    if(queries.searchType && queries.searchText && queries.searchText.length >= 3){
        var searchTypes = queries.searchType.toLowerCase().split(',');
        var postQueries = [];

        if(searchTypes.indexOf('title') >= 0){
        postQueries.push('title LIKE "%' + queries.searchText + '%"');
        }
        if(searchTypes.indexOf('body') >= 0){
        postQueries.push('content LIKE "%' + queries.searchText + '%"');
        }
        // console.log('postQueries: ' + postQueries);

        if(postQueries.length > 0){
        // 연산자 우선수위 때문에 각각 괄호로 묶음
        searchQuery = ('WHERE ' + postQueries.pop()) + (postQueries.length > 0?' or ' + postQueries.pop():'');
        }
        console.log('searchQuery: '+ searchQuery);

        return searchQuery;
    }
}
