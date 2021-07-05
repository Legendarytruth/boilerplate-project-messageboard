'use strict';
require('dotenv').config();
const mongoose = require("mongoose");
const ObjectId = require('mongodb').ObjectId;
const Schema = mongoose.Schema;

const db = mongoose.connect(process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true})

const ThreadSchema = new Schema({
  text: { type: String, required: true },
  delete_password: { type: String, required: true, select: false },
  created_on: { type: Date, default: new Date() },
  bumped_on: { type: Date, default: new Date(), index: true },
  reported: { type: Boolean, default: false, select: false },
  replies: { type: [String], default: [] }
},{ versionKey: false })

const ReplySchema = new Schema({
  text: { type: String, required: true },
  delete_password: { type: String, required: true, select: false },
  thread_id: { type: String, required: true },
  created_on: { type: Date, default: new Date(), index: true},
  reported: { type: Boolean, default: false, select: false }
},{ versionKey: false })




let Thread = mongoose.model("Thread", ThreadSchema);
let Reply = mongoose.model("Reply", ReplySchema);

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .get(function (req, res){
      let new_thread = req.params.board;
      //let mod = mongoose.model(new_thread, ThreadSchema, new_thread)   
      mongoose.model(new_thread, ThreadSchema).find({}).sort({bumped_on: 'desc'}).limit(10).exec((err, thread) =>{
      return res.json(thread)
      })
      //console.log(rep)
      
    })

    .post(function (req, res){
      //console.log(req.params.board)
      //console.log("text: "+req.body.text)
      //console.log("thread_id: "+req.body.thread_id)
      if(!req.body.text || !req.params.board || !req.body.delete_password){
        return res.json({error:"Missing field(s)."})
      }
      let new_thread = req.params.board;
      let thread = mongoose.model(new_thread, ThreadSchema, new_thread)
      let thread1 = new Thread({text: req.body.text, delete_password: req.body.delete_password, created_on: new Date(), bumped_on: new Date(), reported: false, replies: []})
      thread(thread1).save((err, result) =>{
        if(err){
          return res.json({error: "Board Post Error"})
        }
        return res.redirect('/b/' + new_thread +'/')
      })
    })

    .delete(function (req, res){
      //console.log("Board: " + req.body.board)
      //console.log("T ID: " + req.body.thread_id)
      //console.log("Del_Pas: "+req.body.delete_password)
      if(!req.params.board || ! req.body.thread_id || ! req.body.delete_password){
        return res.json({error:"Missing field(s)."})
      }
      let new_thread = req.params.board;
      mongoose.model(new_thread, ThreadSchema).findById(req.body.thread_id).select('delete_password').exec((err, thread) =>{
        if(err || !thread){
          return res.json({error: "Board Delete 1 Error"})
        }
        if(thread.delete_password === req.body.delete_password){
          mongoose.model(new_thread, ThreadSchema).findByIdAndDelete(req.body.thread_id, (err, result) =>{
            if(err || !result){
              return res.json({error: "Board Delete 2 Error"})
            }
            return res.send("success")
          })
        }else{
          return res.send("incorrect password")
        }
      })
    })

    .put(function (req, res){
      //console.log(req.params.board)
      //console.log(req.body.thread_id)
      if(!req.params.board || ! req.body.thread_id){
        return res.json({error:"Missing field(s)."})
      }
      let new_thread = req.params.board
      mongoose.model(new_thread, ThreadSchema).findByIdAndUpdate(req.body.thread_id, {reported: true},(err, thread) =>{
        if(err || !thread){
          return res.json({error: "Board Put Error"})
        }
        return res.send("success")

    })
    })
  
  app.route('/api/replies/:board')
    .get(async function (req, res){
      //console.log("Thread_Id: " + req.body.thread_id)
      //console.log("Board: " + req.params.board)
      let new_thread = req.params.board;
      //let mod = mongoose.model(new_thread, ThreadSchema, new_thread)   
      mongoose.model("replies"+new_thread, ReplySchema).find({}).sort({created_on: 'desc'}).limit(10).exec((err, thread) =>{
      return res.json(thread)
      })
    })

    .post(function (req, res){
      //console.log("Text: " + req.body.text);
      //console.log("Board: " + req.body.board);
      //console.log("Thread_Id: " + req.body.thread_id);
      //console.log("D_P: " + req.body.delete_password)
      //console.log("Posted with Reply: " + req.body.thread_id)
      if(!req.params.board || ! req.body.thread_id || ! req.body.delete_password || !req.body.text){
        return res.json({error:"Missing field(s)."})
      }
      let new_thread = req.params.board;

      let new_reply = new Reply({text: req.body.text, delete_password: req.body.delete_password, thread_id: req.body.thread_id, created_on: new Date(), reported: false})
      new_reply.save(new_reply, (err, result) =>{
        if(err){
          return res.json({error: "Reply Post 1 Error"})
        }
        mongoose.model(new_thread, ThreadSchema).findByIdAndUpdate(req.body.thread_id, {$set: {bumped_on: new Date()}, $push: {replies:result._id}}, (err, thread) =>{
        if(err || !thread){
          return res.json({error: "Reply Post 2 Error"})
        }
        res.redirect("/b/" +new_thread +"/" + req.body.thread_id + "/")
      })
      })
      
    })

    .delete(function (req, res){
      //console.log("Board: " + req.params.board);
      //console.log("Thread_Id: " + req.body.thread_id);
      //console.log("Reply_Id: " + req.body.reply_id)
      //console.log("Del_Password: " + req.body.delete_password)
      let board = req.params.board;
      mongoose.model("replies", ReplySchema).findById(req.body.reply_id).select('delete_password').exec((err, result) =>{
        //console.log(result)
        if(result.delete_password === req.body.delete_password){
          mongoose.model(board, ThreadSchema).findById(req.body.thread_id, (err, thread) =>{
            thread.replies.forEach((value, index, array) =>{
              if(value === req.body.reply_id){
                thread.replies[index] = '[deleted]'
                thread.save((err, result) => {
                  if(err){
                    return res.send("Reply Delete Error")
                  }
                  //console.log(thread.replies)
                  return res.send("success")
                })
              }
            })
            
          })
        }else{
          return res.send("incorrect password")
        }
      })
    })

    .put(function (req, res){
      //console.log("Board: " + req.body.board);
      //console.log("Thread_Id: " + req.body.thread_id);
      //console.log("Reply_Id" + req.body.reply_id)
      if(!req.params.board || !req.body.thread_id || !req.body.reply_id){
        return res.send("Missing field(s)")
      }

      let board = req.params.board;
      mongoose.model("replies"+board, ReplySchema).findByIdAndUpdate(req.body.reply_id, {reported: true}, (err, result) => {
        if(err){
          return res.send("Reply Put Error")
        }
        return res.send("success")
      })
    })

};
