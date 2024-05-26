const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Razorpay = require('razorpay');
const request = require('request');
const mongoose = require('mongoose');
const Promise = require('bluebird');
const pdf = Promise.promisifyAll(require('html-pdf'));
var cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');
// mongoose.connect('mongodb://localhost:27017/vimalcollegerevamp', { useNewUrlParser: true, useUnifiedTopology: true });
// mongoose.connect('mongodb+srv://kiranjc:kiran_gmail1@cluster0-9way1.mongodb.net/test?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect('mongodb+srv://jkiranc:jkiranc1@cluster0-swv9y.mongodb.net/test?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });


const OTPCollections = mongoose.model('OTPCollections', { otpno: String, mobileno: String });
const userTempData = mongoose.model('userTempData', {
    app_tempreg: String,
    app_name: String,
    app_course: String,
    app_fathername: String,
    app_mothername: String,
    app_fatheroccupation: String,
    app_motheroccupation: String,
    app_presentadd: String,
    app_emailaddress: String,
    app_birth: String,
    app_religion: String,
    app_caste: String,
    app_nationality: String,
    app_maritalstatus: String,
    app_qualifyingexam: {
        type: Array,
        'default': []
    },
    app_mobileno: String,
    app_profilepic: String,
    app_aadharno: String,
    app_order_id: String
});

const userMainData = mongoose.model('userMainData', {
    app_tempreg: String,
    app_appregnumber: String,
    app_name: String,
    app_course: String,
    app_fathername: String,
    app_mothername: String,
    app_fatheroccupation: String,
    app_motheroccupation: String,
    app_presentadd: String,
    app_emailaddress: String,
    app_birth: String,
    app_religion: String,
    app_caste: String,
    app_nationality: String,
    app_maritalstatus: String,
    app_qualifyingexam: {
        type: Array,
        'default': []
    },
    app_mobileno: String,
    app_profilepic: String,
    app_aadharno: String,
    app_order_id: String,
    app_paymentstatus: String,
    app_payment_id: String,
    app_regdate: String
});

const port = process.env.PORT || 80;

var instance = new Razorpay({
    key_id: 'rzp_live_zXAILo1DS6ulat',
    key_secret: 'AQ3D65JsbjROAUeWcavl93Yk',
});

var userdata = {}

const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors({
    "Access-Control-Allow-Origin": "*"
}))
//index route for ask mob no
app.get('/', (req, res) => {
    res.render("index");
});


const upload = multer({});
// Registration form with profile photo
app.post('/registration', (req, res) => {
    const phoneno = req.body.phoneno;
    const nowTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    let updatetosheet = 'https://script.google.com/macros/s/AKfycbxqrj_GI4Lcap6t5IGywriYi7dylB_zaqxWWLsaqxbPYmhJnbZS/exec?Phone%20No=' + phoneno + '&sheetName=Only Numbers&Date=' + nowTime
    request(updatetosheet, function (error, response, body) {
        console.error('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    });

    res.render('regform', { mobileno: phoneno });
});


//otp validation -> sent to mobile number
app.post('/otpvalidation', (req, res) => {
    const otpvalidationno = req.body.otpvalidationno;
    OTPCollections.countDocuments({ otpno: otpvalidationno }, function (err, count) {
        if (count > 0) {
            console.log("count", count)
            console.log("otpvalidation no", otpvalidationno);
            var mobilenofromdb;
            OTPCollections.find({ otpno: otpvalidationno }, function (err, optresponse) {
                if (err) {
                    console.log(mobilenofromdb);
                    res.render('enterotp', { status: 'Entered OTP is invalid Try again' })
                } else {
                    console.log("otpresponse", optresponse)
                    console.log(mobilenofromdb);
                    if (optresponse[0].mobileno) {
                        mobilenofromdb = optresponse[0].mobileno;
                    } else {
                        mobilenofromdb = '56'
                    }
                    console.log(mobilenofromdb)
                }
                res.render('regform', { mobileno: mobilenofromdb });
            });
        } else {
            res.render('enterotp', { status: 'Entered OTP is invalid Try again' })
        }
    });

});


app.get('/preview', (req, res) => {
    userMainData.find({ app_payment_id: 'pay_ESnw4QAfeJ3ES5' }, function (err, optresponse) {
        res.render('preview', { userdata: optresponse[0] });
    })
});

app.get('/edit-application/:tempregno', (req, res) => {
    userTempData.find({ app_tempreg: req.params.tempregno }, function (err, optresponse) {
        // res.send('im temp reg')
        res.render('editreg', { userdata: optresponse[0] });
    })

    userTempData.updateOne({ app_tempreg: req.params.tempregno }, { $unset: { app_profilepic: "datanone" } }, function (err, optresponse) {
        console.log("removed image from temp")
    })
})
// Post form data sent from '/registraion' route
app.post('/fill-registration', upload.single('file'), (req, res) => {

    const base64str = req.file.buffer.toString('base64');
    // console.log('req.body', req.body)
    let tempno = "REG" + Math.floor(100000 + Math.random() * 900000);
    // var base64str = base64_encode('images/' + file.filename);
    let tempnewdata = [{ "app_exam_passed": req.body.reg_exam_passed },
    { "app_yearofpassing": req.body.reg_yearofpassing },
    { "app_schoolname": req.body.reg_schoolname },
    { "app_board": req.body.reg_board },
    {
        "reg_marks": [{ "english": req.body.reg_marks_english },
        { "physics": req.body.reg_marks_physics },
        { "chemistry": req.body.reg_marks_chemistry },
        { "biology": req.body.reg_marks_biology },
        { "botany": req.body.reg_marks_botany },
        { "zoology": req.body.reg_marks_zoology },
        { "total": req.body.reg_marks_total }]
    }]

    console.log("temp new data", tempnewdata)
    const usertempsave = new userTempData({
        'app_tempreg': tempno,
        'app_name': req.body.reg_name,
        'app_course': req.body.reg_course,
        'app_birth': req.body.reg_birth.split('-').reverse().join('/'),
        'app_fathername': req.body.reg_fathername,
        'app_mothername': req.body.reg_mothername,
        'app_fatheroccupation': req.body.reg_fatheroccupation,
        'app_motheroccupation': req.body.reg_motheroccupation,
        'app_emailaddress': req.body.reg_emailaddress,
        'app_mobileno': req.body.reg_mobileno,
        'app_religion': req.body.reg_religion,
        'app_caste': req.body.reg_caste,
        'app_presentadd': req.body.reg_presentaddress,
        'app_nationality': req.body.reg_nationality,
        'app_maritalstatus': req.body.reg_maritalstatus,
        'app_qualifyingexam': tempnewdata,
        'app_profilepic': 'data:image/png;base64,' + base64str,
        'app_aadharno': req.body.reg_aadharno,
    });
    usertempsave.save().then(() => console.log('new temp created'));
    // res.render('uploadaadhar', { usertempreg: usertempsave.app_tempreg });

    res.render('preview', { userdata: usertempsave });
});

app.get('/payment/:reg_tempno', (req, res) => {

    var options = {
        amount: 75000,
        currency: "INR",
        receipt: req.params.reg_tempno,
        payment_capture: '0'
    };
    instance.orders.create(options, function (err, order) {
        console.log("orderid", order.id)
        var order_id = order.id;
        userTempData.update({ "app_tempreg": req.params.reg_tempno }, { $set: { 'app_order_id': order_id } }, (req, res) => {
            console.log(res);
        })
        res.render('razorpay', { order_id: order.id, userdata: userdata })
    });
});
//upload data to db using download button
app.get('/downloadapp/:pay_id', (req, res) => {
    console.log("pay id", req.params.pay_id);
    userMainData.countDocuments({ app_payment_id: req.params.pay_id }, function (err, count) {
        if (count > 0) {
            console.log("count", count);
            userMainData.find({ app_payment_id: req.params.pay_id }, function (err, optresponse) {
                // res.render("print", { userdata: optresponse[0] });
                res.render("print", { userdata: optresponse[0] }, function (err, html) {
                    // console.log(html);
                    const config = {
                        "format": "A4",
                        "orientation": "portrait",
                        "dpi": 200,
                        "quality": 80,
                        "border": {
                            "left": "1cm",
                            "right": "1cm",
                            "top": "1cm",
                            "bottom": "1cm"
                        },
                        "header": {
                            "height": "10mm"
                        },
                        "footer": {
                            "height": "10mm"
                        },
                        childProcessOptions: {
    env: {
      OPENSSL_CONF: '/dev/null',
    },
  }
                    }
                    /*pdf.create(html, config).toFile('./Application.pdf', function (err, resp) {
                        if (err) return console.log(err);
                        console.log(resp);
                        res.download('./Application.pdf')
                    });*/
                    pdf.create(html, config).toStream((err, stream) => {
                        if (err) {
                            console.log('Error on pdf create:', err);
                            return res.status(500).send('Error generating PDF');
                        }
                        res.setHeader('Content-type', 'application/pdf');
                        res.setHeader('Content-Disposition', 'attachment; filename="Application.pdf"');
                        stream.pipe(res);
                    });
                })
            });
        } else {
            request('https://rzp_live_zXAILo1DS6ulat:AQ3D65JsbjROAUeWcavl93Yk@api.razorpay.com/v1/payments/' + req.params.pay_id, function (error, response, body) {
                var responsecap = JSON.parse(body);
                // console.log('final response from the server before update', responsecap);
                var rightNow = new Date();
                var reg_date = rightNow.toISOString().slice(0, 10).split('-').reverse().join('/');
                var currentdate = rightNow.toISOString().slice(0, 7).replace(/-/g, "");
                utc = rightNow.getTime() + (rightNow.getTimezoneOffset() * 60000);
                nd = new Date(utc + (3600000 * +5.5));
                var isttime = nd.toLocaleString();
                var dateandtime = reg_date + isttime.split(',')[1]
                console.log("IST now is : " + dateandtime);
                if (responsecap['status'] == 'captured') {
                    userTempData.find({ app_order_id: responsecap['order_id'] }, function (err, optresponse) {
                        if (err) {
                            res.send('you have not paid')
                        } else {
                            userMainData.countDocuments({}, (err, totalcount) => {

                                // console.log("done date", reg_date)
                                // console.log("final otpresponse", optresponse);
                                const maindata = new userMainData({
                                    'app_name': optresponse[0]['app_name'],
                                    'app_course': optresponse[0]['app_course'],
                                    'app_birth': optresponse[0]['app_birth'],
                                    'app_mobileno': optresponse[0]['app_mobileno'],
                                    'app_religion': optresponse[0]['app_religion'],
                                    'app_caste': optresponse[0]['app_caste'],
                                    'app_emailaddress': optresponse[0]['app_emailaddress'],
                                    'app_fathername': optresponse[0]['app_fathername'],
                                    'app_mothername': optresponse[0]['app_mothername'],
                                    'app_fatheroccupation': optresponse[0]['app_fatheroccupation'],
                                    'app_motheroccupation': optresponse[0]['app_motheroccupation'],
                                    'app_presentadd': optresponse[0]['app_presentadd'],
                                    'app_nationality': optresponse[0]['app_nationality'],
                                    'app_maritalstatus': optresponse[0]['app_maritalstatus'],
                                    'app_qualifyingexam': optresponse[0]['app_qualifyingexam'],
                                    'app_profilepic': optresponse[0]['app_profilepic'],
                                    'app_aadharno': optresponse[0]['app_aadharno'],
                                    'app_order_id': responsecap['order_id'],
                                    'app_paymentstatus': responsecap['status'],
                                    'app_payment_id': responsecap['id'],
                                    'app_appregnumber': currentdate + totalcount,
                                    'app_regdate': reg_date
                                });
                                maindata.save().then(() => console.log("Updated application in Main DB"));
                                let updatetosheet = 'https://script.google.com/macros/s/AKfycbxqrj_GI4Lcap6t5IGywriYi7dylB_zaqxWWLsaqxbPYmhJnbZS/exec?Name=' + optresponse[0]['app_name'] + '&Course=' + optresponse[0]['app_course'] + '&DOB=' + optresponse[0]['app_birth'] + '&MobileNo=' + optresponse[0]['app_mobileno'] + '&Nationality=' + optresponse[0]['app_nationality'] + '&Email=' + optresponse[0]['app_emailaddress'] + '&Aadhar No=' + optresponse[0]['app_aadharno'] + '&Father Name=' + optresponse[0]['app_fathername'] + '&Mother Name=' + optresponse[0]['app_mothername'] + '&Father Occupation=' + optresponse[0]['app_fatheroccupation'] + '&Mother Occupation=' + optresponse[0]['app_motheroccupation'] + '&Religion=' + optresponse[0]['app_religion'] + '&Community=' + optresponse[0]['app_caste'] + '&Present Address=' + optresponse[0]['app_presentadd'] + '&Qualifying Exam=' + optresponse[0]['app_qualifyingexam'][0].app_exam_passed + '&Marital Status=' + optresponse[0]['app_maritalstatus'] + '&Order Id=' + optresponse[0]['app_order_id'] + '&Phone No=' + optresponse[0]['app_mobileno'] + '&Reg No=' + currentdate + totalcount + '&Reg Date=' + reg_date + '&Payment Date=' + dateandtime + '&sheetName=Registration Data';
                                request(updatetosheet, function (error, response, body) {
                                    console.error('error:', error); // Print the error if one occurred
                                    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                                });
                                let tempnewuserdata = {
                                    'app_name': optresponse[0]['app_name'],
                                    'app_course': optresponse[0]['app_course'],
                                    'app_birth': optresponse[0]['app_birth'],
                                    'app_mobileno': optresponse[0]['app_mobileno'],
                                    'app_religion': optresponse[0]['app_religion'],
                                    'app_caste': optresponse[0]['app_caste'],
                                    'app_emailaddress': optresponse[0]['app_emailaddress'],
                                    'app_fathername': optresponse[0]['app_fathername'],
                                    'app_mothername': optresponse[0]['app_mothername'],
                                    'app_fatheroccupation': optresponse[0]['app_fatheroccupation'],
                                    'app_motheroccupation': optresponse[0]['app_motheroccupation'],
                                    'app_presentadd': optresponse[0]['app_presentadd'],
                                    'app_nationality': optresponse[0]['app_nationality'],
                                    'app_maritalstatus': optresponse[0]['app_maritalstatus'],
                                    'app_qualifyingexam': optresponse[0]['app_qualifyingexam'],
                                    'app_profilepic': optresponse[0]['app_profilepic'],
                                    'app_aadharno': optresponse[0]['app_aadharno'],
                                    'app_order_id': responsecap['order_id'],
                                    'app_paymentstatus': responsecap['status'],
                                    'app_payment_id': responsecap['id'],
                                    'app_appregnumber': currentdate + totalcount,
                                    'app_regdate': reg_date
                                }
                                res.render("printemail", { userdata: tempnewuserdata }, function (err, html) {
                                    const config = {
                                        "format": "A4",
                                        "orientation": "portrait",
                                        "dpi": 200,
                                        "quality": 100,
                                        "border": {
                                            "left": "1cm",
                                            "right": "1cm",
                                            "top": "1cm",
                                            "bottom": "1cm"
                                        },
                                        "header": {
                                            "height": "10mm"
                                        },
                                        "footer": {
                                            "height": "10mm"
                                        },
                                        childProcessOptions: {
    env: {
      OPENSSL_CONF: '/dev/null',
    },
  }
                                    }

                                    pdf.create(html, config).toFile('./Application.pdf', function (err, resp) {
                                        if (err) return console.log(err);
                                        const transporter = nodemailer.createTransport({
                                            service: 'gmail',
                                            auth: {
                                                user: 'cheersbyenotifications@gmail.com',
                                                pass: 'Password@2019' // naturally, replace both with your real credentials or an application-specific password
                                            }
                                        });

                                        const mailOptions = {
                                            from: 'cheersbyenotifications@gmail.com',
                                            to: 'drvimal0605@gmail.com',
                                            subject: 'Application',
                                            text: '2023',
                                            attachments: [
                                                {   // file on disk as an attachment
                                                    filename: 'Application.pdf',
                                                    path: 'Application.pdf' // stream this file
                                                }
                                            ]
                                        };

                                        transporter.sendMail(mailOptions, function (error, info) {
                                            if (error) {
                                                console.log(error);
                                                res.send({ status: "error" })
                                            } else {
                                                console.log('Email sent: ' + info.response);
                                                res.send({ status: "success" })
                                            }
                                        });
                                    })

                                });

                                console.log('totalcount', totalcount)
                                // res.render("print1", { userdata: optresponse[0],appregno: currentdate+totalcount });
                            })
                        }
                    });
                }
            });
        }
    });
});

app.get('/download', (req, res) => {
    res.render('downloadindex');
})

app.post('/download', (req, res) => {
    const phoneno = req.body.phoneno;
    //const regno = req.body.regno;
    const dob = req.body.dob.split('-').reverse().join('/');

    console.log("im body", req.body)
    //console.log(typeof regno)
    /*if (regno == "2020057") {
        userMainData.find({ "app_appregnumber": regno, "app_mobileno": phoneno, "app_birth": dob }, function (err, optresponse) {
            if (err) {
                res.send('you are not registered')
            }
            else if (optresponse.length == 0) {
                res.redirect("/");
            } else {
                // console.log("final otpresponse", optresponse);
                // res.render("print", { userdata: optresponse[0] });

                res.render("printOld", { userdata: optresponse[0] }, function (err, html) {
                    // console.log(html);
                    // res.send(html);
                    const config = {
                        "format": "A4",
                        "orientation": "portrait",
                        "dpi": 200,
                        "quality": 100,
                        "border": {
                            "left": "1cm",
                            "right": "1cm",
                            "top": "1cm",
                            "bottom": "1cm"
                        },
                        "header": {
                            "height": "10mm"
                        },
                        "footer": {
                            "height": "10mm"
                        },
                        childProcessOptions: {
    env: {
      OPENSSL_CONF: '/dev/null',
    },
  }
                    }

                    pdf.create(html, config).toFile('./Application.pdf', function (err, resp) {
                        if (err) return console.log(err);
                        // console.log(resp);
                        res.download('./Application.pdf')
                    });
                })
            }
        });
    } else if (regno == "20200511") {
        userMainData.find({ "app_appregnumber": regno, "app_mobileno": phoneno, "app_birth": dob }, function (err, optresponse) {
            if (err) {
                res.send('you are not registered')
            }
            else if (optresponse.length == 0) {
                res.redirect("/");
            } else {
                // console.log("final otpresponse", optresponse);
                // res.render("print", { userdata: optresponse[0] });

                res.render("printOld", { userdata: optresponse[0] }, function (err, html) {
                    // console.log(html);
                    // res.send(html);
                    const config = {
                        "format": "A4",
                        "orientation": "portrait",
                        "dpi": 200,
                        "quality": 100,
                        "border": {
                            "left": "1cm",
                            "right": "1cm",
                            "top": "1cm",
                            "bottom": "1cm"
                        },
                        "header": {
                            "height": "10mm"
                        },
                        "footer": {
                            "height": "10mm"
                        },
                        childProcessOptions: {
    env: {
      OPENSSL_CONF: '/dev/null',
    },
  }
                    }

                    pdf.create(html, config).toFile('./Application.pdf', function (err, resp) {
                        if (err) return console.log(err);
                        // console.log(resp);
                        res.download('./Application.pdf')
                    });
                })
            }
        });
    } else if (regno == "20200512") {
        userMainData.find({ "app_appregnumber": regno, "app_mobileno": phoneno, "app_birth": dob }, function (err, optresponse) {
            if (err) {
                res.send('you are not registered')
            }
            else if (optresponse.length == 0) {
                res.redirect("/");
            } else {
                // console.log("final otpresponse", optresponse);
                // res.render("print", { userdata: optresponse[0] });

                res.render("printOld", { userdata: optresponse[0] }, function (err, html) {
                    // console.log(html);
                    // res.send(html);
                    const config = {
                        "format": "A4",
                        "orientation": "portrait",
                        "dpi": 200,
                        "quality": 100,
                        "border": {
                            "left": "1cm",
                            "right": "1cm",
                            "top": "1cm",
                            "bottom": "1cm"
                        },
                        "header": {
                            "height": "10mm"
                        },
                        "footer": {
                            "height": "10mm"
                        },
                        childProcessOptions: {
    env: {
      OPENSSL_CONF: '/dev/null',
    },
  }
                    }

                    pdf.create(html, config).toFile('./Application.pdf', function (err, resp) {
                        if (err) return console.log(err);
                        // console.log(resp);
                        res.download('./Application.pdf')
                    });
                })
            }
        });
    } else if (regno == "20200513") {
        userMainData.find({ "app_appregnumber": regno, "app_mobileno": phoneno, "app_birth": dob }, function (err, optresponse) {
            if (err) {
                res.send('you are not registered')
            }
            else if (optresponse.length == 0) {
                res.redirect("/");
            } else {
                // console.log("final otpresponse", optresponse);
                // res.render("print", { userdata: optresponse[0] });

                res.render("printOld", { userdata: optresponse[0] }, function (err, html) {
                    // console.log(html);
                    // res.send(html);
                    const config = {
                        "format": "A4",
                        "orientation": "portrait",
                        "dpi": 200,
                        "quality": 100,
                        "border": {
                            "left": "1cm",
                            "right": "1cm",
                            "top": "1cm",
                            "bottom": "1cm"
                        },
                        "header": {
                            "height": "10mm"
                        },
                        "footer": {
                            "height": "10mm"
                        },
                        childProcessOptions: {
    env: {
      OPENSSL_CONF: '/dev/null',
    },
  }
                    }

                    pdf.create(html, config).toFile('./Application.pdf', function (err, resp) {
                        if (err) return console.log(err);
                        // console.log(resp);
                        res.download('./Application.pdf')
                    });
                })
            }
        });
    } else if (regno == "20200614") {
        userMainData.find({ "app_appregnumber": regno, "app_mobileno": phoneno, "app_birth": dob }, function (err, optresponse) {
            if (err) {
                res.send('you are not registered')
            }
            else if (optresponse.length == 0) {
                res.redirect("/");
            } else {
                // console.log("final otpresponse", optresponse);
                // res.render("print", { userdata: optresponse[0] });

                res.render("printOld", { userdata: optresponse[0] }, function (err, html) {
                    // console.log(html);
                    // res.send(html);
                    const config = {
                        "format": "A4",
                        "orientation": "portrait",
                        "dpi": 200,
                        "quality": 100,
                        "border": {
                            "left": "1cm",
                            "right": "1cm",
                            "top": "1cm",
                            "bottom": "1cm"
                        },
                        "header": {
                            "height": "10mm"
                        },
                        "footer": {
                            "height": "10mm"
                        },
                        childProcessOptions: {
    env: {
      OPENSSL_CONF: '/dev/null',
    },
  }
                    }

                    pdf.create(html, config).toFile('./Application.pdf', function (err, resp) {
                        if (err) return console.log(err);
                        // console.log(resp);
                        res.download('./Application.pdf')
                    });
                })
            }
        });

    } else {*/
        //userMainData.find({ "app_appregnumber": regno, "app_mobileno": phoneno, "app_birth": dob }, function (err, optresponse) {
          userMainData.find({ "app_mobileno": phoneno, "app_birth": dob }, function (err, optresponse) {
            if (err) {
                res.send('you are not registered')
            }
            else if (optresponse.length == 0) {
                res.redirect("/");
            } else {
                // console.log("final otpresponse", optresponse);
                // res.render("print", { userdata: optresponse[0] });

                res.render("print", { userdata: optresponse[0] }, function (err, html) {
                    // console.log(html);
                    // res.send(html);
                    const config = {
                        "format": "A4",
                        "orientation": "portrait",
                        "dpi": 200,
                        "quality": 100,
                        "border": {
                            "left": "1cm",
                            "right": "1cm",
                            "top": "1cm",
                            "bottom": "1cm"
                        },
                        "header": {
                            "height": "10mm"
                        },
                        "footer": {
                            "height": "10mm"
                        },
                        childProcessOptions: {
    env: {
      OPENSSL_CONF: '/dev/null',
    },
  }
                    }

                    pdf.create(html, config).toFile('./Application.pdf', function (err, resp) {
                        if (err) return console.log(err);
                        // console.log(resp);
                        res.download('./Application.pdf')
                    });
                })
            }
        });
    //}


});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
