require("dotenv").config();
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI).then(async () => {
    require("./src/models");
    const Skill = require("./src/models/Skill");
    const User = require("./src/models/User");
    const jwt = require("jsonwebtoken");

    // Simulate frontend API layer manually via HTTP
    const http = require("http");
   
    const ko = await User.findOne({name: /KOLLA/});
    const ha = await User.findOne({name: /Harini/});
    const token = jwt.sign({id: ko._id}, process.env.JWT_SECRET);
    const skill = await Skill.findOne({user_id: ha._id});
   
    const data = JSON.stringify({
        skill_id: skill._id.toString(),
        message: "Hello"
    });

    const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/requests',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
            'Authorization': 'Bearer ' + token
        }
    }, res => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
            console.log("STATUS:", res.statusCode);
            console.log("RESPONSE:", body);
            process.exit(0);
        });
    });
    req.on('error', e => console.error(e));
    req.write(data);
    req.end();
});