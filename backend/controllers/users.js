const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { NODE_ENV, JWT_SECRET } = process.env;
const { ValidationError, CastError } = mongoose.Error;

const User = require('../models/user');

const { SUCCESS_CREATED, DUPLICATE_OBJECT } = require('../utils/response-status');

const NotFound = require('../utils/errors/NotFound');
const BadRequests = require('../utils/errors/BadRequest');
const ConflictingRequest = require('../utils/errors/ConflictingRequest');

const getUserList = (req, res, next) => {
  User.find({})
    .then((userList) => res.send(userList))
    .catch(next);
};

const getUserId = (req, res, next) => {
  User.findById(req.params.userId)
    .then((selectedUser) => {
      if (selectedUser) {
        res.send(selectedUser);
      } else { next(new NotFound('Пользователь с указанным _id не найден')); }
    })
    .catch((error) => {
      if (error instanceof CastError) {
        next(new BadRequests('Неправильный _id пользователя'));
      } else { next(error); }
    });
};

const registerUser = (req, res, next) => {
  const {
    name, about, avatar, email, password,
  } = req.body;
  const passwordHash = bcrypt.hash(password, 10);
  passwordHash.then((hash) => User.create({
    name, about, avatar, email, password: hash,
  }))
    .then(() => res.status(SUCCESS_CREATED).send({
      name, about, avatar, email,
    }))
    .catch((error) => {
      if (error instanceof ValidationError) {
        next(new BadRequests('Переданы некорректные данные'));
      } else if (error.code === DUPLICATE_OBJECT) {
        next(new ConflictingRequest('Пользователь с указанной почтой уже существует'));
      } else { next(error); }
    });
};

const updateUserData = (req, res, next) => {
  const { name, about } = req.body;
  User.findByIdAndUpdate(req.user._id, { name, about }, {
    new: true,
    runValidators: true,
  })
    .then((updatedData) => res.send(updatedData))
    .catch((error) => {
      if (error instanceof ValidationError) {
        next(new BadRequests('При обновлении профиля указаны некорректные данные'));
      } else { next(error); }
    });
};

const updateUserAvatar = (req, res, next) => {
  const { avatar } = req.body;
  User.findByIdAndUpdate(req.user._id, { avatar }, {
    new: true,
    runValidators: true,
  })
    .then((updatedAvatar) => res.send(updatedAvatar))
    .catch((error) => {
      if (error instanceof ValidationError) {
        next(new BadRequests('При обновлении аватара переданы некорректные данные'));
      } else { next(error); }
    });
};

const authorizeUser = (req, res, next) => {
  const { email, password } = req.body;
  return User.findUserByCredentials(email, password)
    .then((selectedUser) => {
      const token = jwt.sign({ _id: selectedUser._id }, NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret', { expiresIn: '7d' });
      res.send({ token });
    })
    .catch((error) => next(error));
};

const getUserProfile = (req, res, next) => {
  User.findById(req.user._id)
    .then((selectedUser) => {
      if (!selectedUser) {
        next(new NotFound('Пользователь с указанным _id не найден'));
      } else { res.send(selectedUser); }
    })
    .catch((error) => { next(error); });
};

module.exports = {
  getUserList,
  getUserId,
  registerUser,
  updateUserData,
  updateUserAvatar,
  authorizeUser,
  getUserProfile,
};
