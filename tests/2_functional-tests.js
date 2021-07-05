const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
chai.use(chaiHttp);

suite('Functional Tests', function() {

  test("Creating a new thread:", function(done){
    chai.request(server)
    .post('/api/threads/tester')
    .send({text: "Hello", delete_password: "delete"})
    .end(function(err, res){
      assert.equal(res.status, 200);
      assert.include(res.redirects[0], '/b/tester')
      done();
    })
  })

  test("Viewing the 10 most recent threads with 3 replies each", function(done){
    chai.request(server)
    .get('/api/threads/tester')
    .end(function(err, res){
      assert.equal(res.status, 200);
      assert.equal(res.type, 'application/json')
      assert.isAtMost(res.body.length, 10)
      done();
    })
  })

  test("Reporting a thread", function(done){
    chai.request(server)
    .get('/api/threads/tester')
    .end(function(err, res){
      let thread = res.body[0]
    
    chai.request(server)
      .put('/api/threads/tester')
      .send({thread_id: thread._id})
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.type, 'text/html')
        assert.equal(res.text, "success")
        done();
    })
    })
  })

  test("Deleting a thread with the incorrect password", function(done){
    chai.request(server)
    .get('/api/threads/tester')
    .end(function(err, res){
      let thread = res.body[0]
    chai.request(server)
      .delete('/api/threads/tester')
      .send({thread_id: thread._id, delete_password: "ttttt"})
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.type, 'text/html')
        assert.equal(res.text, "incorrect password")
        done();
    })
    })
  })

  test("Deleting a thread with the correct password:", function(done){
    chai.request(server)
    .get('/api/threads/tester')
    .end(function(err, res){
      let thread = res.body[0]
    
    chai.request(server)
      .delete('/api/threads/tester')
      .send({thread_id: thread._id, delete_password:"delete"})
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.type, 'text/html')
        assert.equal(res.text, "success")
        done();
    })
    })
  })

  test("Creating a new reply", function(done){
    chai.request(server)
    .get('/api/threads/tester')
    .end(function(err, res){
      let thread = res.body[0]
    //console.log(thread._id)
    chai.request(server)
      .post('/api/replies/tester')
      .send({thread_id: thread._id, delete_password:"delete", text: "Reply"})
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.include(res.redirects[0], '/b/tester/' + thread._id + "/")
        done();
    })
    })
  })

  test("Viewing a single thread with all replies", function(done){
    chai.request(server)
    .get('/api/replies/tester')
    .end(function(err, res){
      assert.equal(res.status, 200);
      assert.equal(res.type, 'application/json')
      assert.isAtMost(res.body.length, 10)
      done();
    })
  })

  test("Deleting a reply with the incorrect password", function(done){
    chai.request(server)
    .get('/api/threads/tester')
    .end(function(err, res){
      let thread = res.body[0]
      
      //console.log(thread.replies[0])
      
      chai.request(server)
      .delete('/api/replies/tester')
      .send({thread_id: thread._id, reply_id: thread.replies[0], delete_password:"Wrong"})
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.type, 'text/html')
        assert.equal(res.text, "incorrect password")
        done();
    })
    })
  })

  test("Deleting a reply with the correct password", function(done){
    chai.request(server)
    .get('/api/threads/tester')
    .end(function(err, res){
      let thread = res.body[0]
      
      //console.log(thread.replies[0])
      
      chai.request(server)
      .delete('/api/replies/tester')
      .send({thread_id: thread._id, reply_id: thread.replies[0], delete_password:"delete"})
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.type, 'text/html')
        assert.equal(res.text, "success")
        done();
    })
    })
  })

  test("Reporting a reply", function(done){
    chai.request(server)
    .get('/api/threads/tester')
    .end(function(err, res){
      let thread = res.body[0]
      
      //console.log(thread.replies[0])
      
      chai.request(server)
      .put('/api/replies/tester')
      .send({thread_id: thread._id, reply_id: thread.replies[0]})
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.type, 'text/html')
        assert.equal(res.text, "success")
        done();
    })
    })
  })


});
