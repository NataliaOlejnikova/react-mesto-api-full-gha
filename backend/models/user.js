const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

const Unauthorized = require('../utils/errors/Unauthorized');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'Жак-Ив Кусто',
    minlength: 2,
    maxlength: 30,
  },
  about: {
    type: String,
    default: 'Исследователь',
    minlength: 2,
    maxlength: 30,
  },
  avatar: {
    type: String,
    default: 'https://pictures.s3.yandex.net/resources/jacques-cousteau_1604399756.png',
    validate: {
      validator: (correct) => validator.isURL(correct),
      message: 'Ошибка загрузки аватара',
    },
  },
  email: {
    type: String,
    validate: {
      validator: (correct) => validator.isEmail(correct),
      message: 'Почта абонента введена неверно',
    },
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
});

// eslint-disable-next-line func-names
userSchema.statics.findUserByCredentials = function (email, password) {
  return this.findOne({ email }).select('+password')
    .then((selectedUser) => {
      if (!selectedUser) { return Promise.reject(new Unauthorized('Имя пользователя или (-и) пароль введены неверно')); }
      return bcrypt.compare(password, selectedUser.password).then((correct) => {
        if (!correct) { return Promise.reject(new Unauthorized('Имя пользователя или (-и) пароль введены неверно')); }
        return selectedUser;
      });
    });
};

module.exports = mongoose.model('user', userSchema);
