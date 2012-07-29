
/*
 * GET home page.
 */


exports.browser = function(req, res){
  res.render('browser', { title: 'Express'});
};
exports.mobile = function(req, res){
  var url = req.params.url;
  res.render('mobile', { title: 'Mobile Connect', url: url });
};
exports.mobilesetup = function(req, res){
  var id = req.params.id;
  var code = req.params.code;
  res.render('mobilesetup', { title: 'Mobile', code: code, id: id });
};
