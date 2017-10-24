exports.result = function (res, code, message, body) {
    var isSuccess = code == codeSuccess;
    if(!body){
        return res.json({
            success:isSuccess,
            code : code,
            message : message
        })
    }
    return res.json({
        success:isSuccess,
        code : code,
        message : message,
        data: body
    })
};