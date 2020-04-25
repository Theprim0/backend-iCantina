import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../models/user.model';

let chai = require('chai');
let chaiHttp = require('chai-http');
const expect = require('chai').expect;
chai.use(chaiHttp);
const url = 'http://localhost:3000';
let users: any[] = []
let token: any;

describe('UserTest: ', () => {
    before((done) => {
        mongoose.connect('mongodb://localhost:27017/testiCantina', { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false }, function () {
            mongoose.connection.db.dropDatabase(function () {
                for (let i = 0; i < 5; i++) {
                    const user = {
                        name: 'testing' + i,
                        mail: 'testing' + i,
                        password: bcrypt.hashSync('123456', 10)
                    }
                    users.push(user);
                }
                const user = {
                    name: 'admin',
                    mail: 'admin',
                    admin: true,
                    employee: true,
                    password: bcrypt.hashSync('123456', 10)
                }
                users.push(user);
                User.create(users).then((usersDB) => {
                    users = usersDB;
                    done()
                })
            })
        });
    })

    describe('Users', () => {
        describe('Add user ', () => {
            it('should insert a user', (done) => {
                chai.request(url)
                    .post('/user/create')
                    .send({ name: 'user1', mail: "user1@mail", password: '123456' })
                    .end(function (err: any, res: any) {
                        expect(res).to.have.status(200);
                        expect(res.ok).to.equals(true);
                        expect(res.token).to.not.equals('');
                        done();
                    });
            });

            it('should receive an error, empty mail', (done) => {
                chai.request(url)
                    .post('/user/create')
                    .send({ name: 'user1', password: '123456' })
                    .end(function (err: any, res: any) {
                        expect(res).to.have.status(400);
                        expect(res.ok).to.equals(false)
                        done();
                    });
            });

            it('should receive  error 400 empty field', (done) => {
                chai.request(url)
                    .post('/user/create')
                    .send({ mail: "user2@mail", password: '123456' })
                    .end(function (err: any, res: any) {
                        expect(res).to.have.status(400);
                        expect(res.ok).to.equals(false)
                        done();
                    });
            });

            it('should receive  error 400 duplicated mail', (done) => {
                chai.request(url)
                    .post('/user/create')
                    .send({ name: 'user1', mail: users[0].mail, password: '123456' })
                    .end(function (err: any, res: any) {
                        expect(res).to.have.status(400);
                        expect(res.ok).to.equals(false)
                        done();
                    });
            });
        });

        describe('Get all user', () => {
            it('Should return array with all user', (done) => {
                chai.request(url)
                    .get('/user')
                    .end(function (err: any, res: any) {
                        expect(res).to.have.status(200);
                        expect(res.body.ok).to.equals(true);
                        expect(res.body.users.length).to.be.at.least(3);
                        expect(res.body.users.length).to.be.at.most(11);
                        done();
                    });
            });


            it('should receive an error, invalid page', (done) => {
                chai.request(url)
                    .get('/user/?page=0')
                    .end(function (err: any, res: any) {
                        expect(res).to.have.status(400);
                        expect(res.ok).to.equals(false)
                        done();
                    });
            });
        });

        describe('Get user', () => {
            it('Should return a single user', (done) => {
                chai.request(url)
                    .get(`/user/get/${users[0]._id}`)
                    .end(function (err: any, res: any) {
                        expect(res).to.have.status(200);
                        expect(res.body.ok).to.equals(true);
                        expect(res.body.user.name).to.equals(users[0].name);
                        done();
                    });
            });

            it('should receive an error, invalid id user', (done) => {
                chai.request(url)
                    .get('/user/get/00012')
                    .end(function (err: any, res: any) {
                        expect(res).to.have.status(404);
                        expect(res.ok).to.equals(false)
                        done();
                    });
            });
        });

        describe('Login', () => {
            it('Shold verificate user and return token', (done) => {
                chai.request(url)
                    .post(`/user/login`)
                    .send({ mail: users[0].mail, password: '123456' })
                    .end(function (err: any, res: any) {
                        expect(res).to.have.status(200);
                        expect(res.body.ok).to.equals(true);
                        expect(res.body.token).to.not.equals('');
                        done();
                    });
            })

            it('Shold return erro 400 mail invalid', (done) => {
                chai.request(url)
                    .post(`/user/login`)
                    .send({ mail: 222, password: '123456' })
                    .end(function (err: any, res: any) {
                        expect(res).to.have.status(400);
                        expect(res.body.ok).to.equals(false);
                        done();
                    });
            })

            it('Shold return error 400 mail empty', (done) => {
                chai.request(url)
                    .post(`/user/login`)
                    .send({ password: '123456' })
                    .end(function (err: any, res: any) {
                        expect(res).to.have.status(400);
                        expect(res.body.ok).to.equals(false);
                        done();
                    });
            })

            it('Shold return error 400 password empty', (done) => {
                chai.request(url)
                    .post(`/user/login`)
                    .send({ mail: 'mail' })
                    .end(function (err: any, res: any) {
                        expect(res).to.have.status(400);
                        expect(res.body.ok).to.equals(false);
                        done();
                    });
            })

            it('Shold return error 400 no parameters', (done) => {
                chai.request(url)
                    .post(`/user/login`)
                    .end(function (err: any, res: any) {
                        expect(res).to.have.status(400);
                        expect(res.body.ok).to.equals(false);
                        done();
                    });
            })

            it('Shold return error 400 no mail invalid', (done) => {
                chai.request(url)
                    .post(`/user/login`)
                    .send({ mail: 222, password: 123456 })
                    .end(function (err: any, res: any) {
                        expect(res).to.have.status(400);
                        expect(res.body.ok).to.equals(false);
                        done();
                    });
            })
        });

        describe('Change range User', () => {
            before('Login like admin user to do the operations', (done) => {
                chai.request(url)
                    .post(`/user/login`)
                    .send({ mail: users[5].mail, password: '123456' })
                    .end(function (err: any, res: any) {
                        token = res.body.token;
                        done();
                    });
            })

            it('Should change the user0 to employee', (done) => {
                chai.request(url)
                    .post(`/user/changeRange/${users[0]._id}`)
                    .send({ employee: true })
                    .set({ 'x-token': token })
                    .end(function (err: any, res: any) {
                        expect(res).to.have.status(200);
                        expect(res.body.ok).to.equals(true);
                        expect(res.body.user.employee).to.equals(true);
                        done()
                    });
            })


            it('Should change the user0 to admin', (done) => {
                chai.request(url)
                    .post(`/user/changeRange/${users[0]._id}`)
                    .send({ admin: true })
                    .set({ 'x-token': token })
                    .end(function (err: any, res: any) {
                        expect(res).to.have.status(200);
                        expect(res.body.ok).to.equals(true);
                        expect(res.body.user.admin).to.equals(true);
                        done()
                    });
            })

            it('Should return error invalid parameter', (done) => {
                chai.request(url)
                    .post(`/user/changeRange/${users[1]._id}`)
                    .send({ admin: 'nose' })
                    .set({ 'x-token': token })
                    .end(function (err: any, res: any) {
                        expect(res).to.have.status(400);
                        expect(res.body.ok).to.equals(false);
                        done()
                    });
            })

            it('Should return error empty parameter', (done) => {
                chai.request(url)
                    .post(`/user/changeRange/${users[1]._id}`)
                    .set({ 'x-token': token })
                    .end(function (err: any, res: any) {
                        expect(res).to.have.status(400);
                        expect(res.body.ok).to.equals(false);
                        done()
                    });
            })

            it('Should change the user1 to employee', (done) => {
                chai.request(url)
                    .post(`/user/changeRange/${users[1]._id}`)
                    .send({ employee: true })
                    .set({ 'x-token': token })
                    .end(function (err: any, res: any) {
                        expect(res).to.have.status(200);
                        expect(res.body.ok).to.equals(true);
                        expect(res.body.user.employee).to.equals(true);
                        done()
                    });
            })

            it('Should return error user 1 is not admin', (done) => {
                chai.request(url)
                    .post(`/user/login`)
                    .send({ mail: users[1].mail, password: '123456' })
                    .end(function (err: any, res: any) {
                        let tokenUser1 = res.body.token;
                        chai.request(url)
                            .post(`/user/changeRange/${users[1]._id}`)
                            .send({ employee: true })
                            .set({ 'x-token': tokenUser1 })
                            .end(function (err: any, res: any) {
                                expect(res).to.have.status(401);
                                done();
                            });
                    });
            });
        });
    });

    after((done) => {
        mongoose.connect('mongodb://localhost:27017/testiCantina', { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false }, function () {
            mongoose.connection.db.dropDatabase(function () {
                done()
            });
        })
    });
})
