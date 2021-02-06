const homeCtrl = {};

// list
homeCtrl.renderIndex = (req, res) => {
    console.log('indexCtrl.renderIndex');

    res.render('home/index');
};

module.exports = homeCtrl;
