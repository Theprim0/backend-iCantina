import { Router, Request, Response, NextFunction } from "express";
import bcrypt from 'bcrypt'
import { Token } from '../classes/token';
import { verificaToken, verificacionTokenAdmin } from '../middlewares/autenticacion';
import { User, Iuser } from "../models/user.model";
import { Order } from '../models/order.model';


const userRoutes = Router();

//Crear un usuario
userRoutes.post('/create', async (req: Request, res: Response) => {
    if (!req.body.name || !req.body.mail || !req.body.uid) {
        return res.status(400).json({
            ok: false,
            error: 'Shold indicate name, email, and uid'
        })
    }
    let user: any;
    try {
        user = await User.findOne({ uid: req.body.uid }).exec()
    } catch (error) {
        return res.status(400).json({
            ok: false,
            error: 'uid error'
        })
    }
    if (user) {
        return res.status(400).json({
            ok: false,
            error: ' User with this mail already exist'
        })
    }
    const usr = {
        name: req.body.name,
        mail: req.body.mail,
        uid: req.body.uid,
        img: req.body.img
    }
    User.create(usr).then(userDB => {
        const userToken = Token.getJwtToken({
            _id: userDB.id,
            name: userDB.name,
            mail: userDB.mail,
            uid: userDB.uid
        });
        res.json({
            ok: true,
            token: userToken
        });
    }).catch(error => {
        res.status(400).json({
            ok: false,
            err: error
        })
    })
})

//Get users paginated
userRoutes.get('/', async (req: any, res: Response, next: NextFunction) => {
    try {
        let page = Number(req.query.page - 1) || 0;
        let skip = page * 10;
        const users = await User.find().limit(10).skip(skip).sort({ _id: -1 }).exec();
        res.json({
            ok: true,
            users
        })
    } catch (error) {
        res.status(400).json({
            ok: false,
            error: 'Invalid page'
        })
    }
})

//Get user by id
userRoutes.get('/get/:idUser', async (req: any, res: Response, next: NextFunction) => {
    try {
        const idUser = req.params.idUser;
        const user = await User.findById(idUser).exec();
        if (user) {
            return res.json({
                ok: true,
                user: user
            })
        } else {
            return res.status(404).json({
                ok: false,
                message: 'Invalido id user'
            })
        }
    } catch (err) {
        return res.status(404).json({
            ok: false,
            message: 'Invalid id user'
        })
    }
})

//Login
userRoutes.post('/login', (req: Request, res: Response) => {
    try {
        User.findOne({ uid: req.body.uid }, (err, userDB) => {
            if (err) {
                return res.status(404).json({
                    ok: false,
                    err
                })
            }
            if (!userDB) {
                return res.status(400).json({
                    ok: false,
                    message: 'Userincorrect'
                });
            }
            const userToken = Token.getJwtToken({
                _id: userDB.id,
                name: userDB.name,
                mail: userDB.mail,
                admin: userDB.admin,
                employee: userDB.employee
            });
            console.log(userDB.mail+" login")
            res.json({
                ok: true,
                token: userToken
            })

        });
    } catch (error) {
        return res.status(400).json({
            ok: false,
            message: 'Mail invalid'
        });
    }
});

// actualizar usuario
userRoutes.post('/update', verificaToken, async (req: any, res: Response) => {
    const user = {
        name: req.body.name || req.user.name,
        mail: req.body.mail || req.user.mail,
    }
    try {
        let usr: any = await User.findOne({ mail: user.mail }).exec();
        if (usr && user.mail !== req.user.mail) {
            return res.status(400).json({
                ok: false,
                message: 'This mail is alrady in use'
            });
        }
    } catch (error) { }

    try {
        User.findByIdAndUpdate(req.user._id, user, { new: true }, (err, userDB) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                })
            };
            if (!userDB) {
                return res.status(404).json({
                    ok: false,
                    message: 'Invalid ID'
                });
            }
            const userToken = Token.getJwtToken({
                _id: userDB.id,
                name: user.name,
                mail: user.mail,
            });
            res.json({
                ok: true,
                token: userToken,
                user: userDB
            });
        });
    } catch (error) {
        return res.status(404).json({
            ok: false,
            message: 'Invalid type id'
        });
    }

});

//get usuario from token
userRoutes.get('/me', [verificaToken], async (req: any, res: Response) => {
    const user = await User.findById(req.user._id).exec();
    if (user) {
        res.json({
            ok: true,
            user: user
        });
    } else {
        res.json({
            ok: false,
            message: 'User not found'
        });
    }
});

userRoutes.post('/changeRange/:idUser', [verificacionTokenAdmin], async (req: any, res: Response) => {
    const idUser = req.params.idUser;

    let userDB;
    try {
        userDB = await User.findById(idUser).exec();
    } catch (error) {
        return res.status(404).json({
            ok: false,
            error
        });
    }
    if (!userDB) {
        return res.status(404).json({
            ok: false,
            message: 'User not found'
        });
    }
    if (req.body.admin === undefined && req.body.employee === undefined) {
        return res.status(400).json({
            ok: false,
            message: 'Empty parameters'
        });
    }
    if (req.body.admin === undefined) {
        req.body.admin = userDB.admin;
    }
    if (req.body.employee === undefined) {
        req.body.employee = userDB.employee;
    }
    const user = {
        admin: req.body.admin,
        employee: req.body.employee
    }

    try {
        User.findByIdAndUpdate(idUser, user, { new: true }, async (err, userDB) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                })
            };
            if (!userDB) {
                return res.status(404).json({
                    ok: false,
                    message: 'Invalid ID'
                });
            }
            res.json({
                ok: true,
                user: await User.findById(idUser).exec()
            });
        });
    } catch (error) {
        return res.status(404).json({
            ok: false,
            message: 'Invalid type id'
        });
    }

});

userRoutes.delete('/deleteUser/:idUser', [verificacionTokenAdmin], async (req: any, res: Response) => {
    const idUser = req.params.idUser;
    let userDB;
    try {
        userDB = await User.findByIdAndDelete(idUser).exec();
        if(userDB){
            let ordersUser=await Order.findOneAndDelete({client:idUser}).exec()
            while(ordersUser){
                ordersUser=await Order.findOneAndDelete({client:idUser}).exec()
            }
            res.redirect('/user')
        }else{
            return res.status(404).json({
                ok: false,
                message: 'User not found'
            });
        }
    } catch (error) {
        return res.status(404).json({
            ok: false,
            error
        });
    }
});

export default userRoutes;