import { controller, get, post, put, log, convert, required } from '../decorator/router'
import mongoose from 'mongoose'
import qiniu from '../libs/qiniu'
import { randomIntro } from '../libs/exam'
import _ from 'lodash'
import xss from 'xss'
import R from 'ramda'

const Character = mongoose.model('Character')
const House = mongoose.model('House')
const Book = mongoose.model('Book')
const IMDb = mongoose.model('IMDb')
const User = mongoose.model('User')
const Product = mongoose.model('Product')
const Payment = mongoose.model('Payment')
const ExamResult = mongoose.model('ExamResult')

const NINE_HOUSES = [
  `House Stark of Winterfell`,
  `House Lannister of Casterly Rock`,
  `House Targaryen of King's Landing`,
  `House Nymeros Martell of Sunspear`,
  `House Baratheon of Storm's End`,
  `House Greyjoy of Pyke`,
  `House Tyrell of Highgarden`,
  `House Tully of Riverrun`,
  `House Arryn of the Eyrie`
]

// const typeOf = value => {
//   let t = R.type(value)
//   let r = {
//     'Array': [],
//     'Object': {},
//     'Number': 0,
//     'String': '',
//     'Boolean': false,
//     'Null': null
//   }

//   return r[t] || ''
// }

// const toXss = (value) => _.reduce(value, (acc, item) => {

// }, typeOf(value))


@controller('/api')
export class DatabaseController {
  @get('db/characters')
  @log
  async characters (ctx, next) {
    var res = await Character
      .find({
        name: { $exists: true },
        tvSeries: { $exists: true },
        'playedBy.0': { $exists: true }
      })
      .populate({
        path: 'IMDb'
      })
      .exec()

    ctx.body = res
  }

  @get('db/IMDb/characters')
  async IMDbCharacters (ctx, next) {
    var res = await IMDb
      .find({
        url: { $exists: true }
      })
      .populate('url')
      .limit(30)
      .exec()

    ctx.body = res
  }

  @get('db/houses')
  async dbHouses (ctx, next) {
    var houses = await House
      .find({
        name: { $exists: true },
        'swornMembers.0': { $exists: true }
      })
      .populate({
        path: 'swornMembers'
      })
      .exec()

    var povCharacters = await IMDb
      .find({})
      .select('name url')
      .exec()

    houses = _.map(houses, house => {
      house.swornMembers = _.filter(house.swornMembers, item => _.find(povCharacters, {url: item.url}))

      return house
    })

    houses = _.sortBy(houses, [item => -item.swornMembers.length])
    ctx.body = houses
  }

  @get('db/books')
  async dbBooks (ctx, next) {
    var res = await Book
      .find({})
      .exec()

    ctx.body = res
  }

  @get('products/:_id')
  @log
  async getProduct (ctx, next) {
    const { _id } = ctx.params
    console.log(_id)
    if (!_id) return (ctx.body = '_id is required')

    let product = await Product
      .findById(_id)
      .exec()

    ctx.body = product
  }

  @get('products')
  async getProducts (ctx, next) {
    let { limit = 50 } = ctx.query
    let products = await Product
      .find({})
      .limit(Number(limit))
      .exec()

    ctx.body = products
  }

  @post('products')
  async postProducts (ctx, next) {
    let product = ctx.request.body
    product = {
      title: xss(product.title),
      price: xss(product.price),
      intro: xss(product.intro),
      parameters: R.map(item => ({ key: xss(item.key), value: xss(item.value) }))(product.parameters),
      images: R.map(xss)(product.images)
    }

    product = new Product(product)

    try {
      await product.save()
      ctx.body = product

    } catch (e) {
      ctx.throw(501, e)
    }
  }

  @put('products')
  async putProducts (ctx, next) {
    let body = ctx.request.body
    const { _id } = body

    let product = await Product.findById(_id).exec()

    if (!product) {
      return (ctx.body = 'product not exist')
    }

    product.title = xss(body.title)
    product.price = xss(body.price)
    product.intro = xss(body.intro)
    product.parameters = R.map(item => ({ key: xss(item.key), value: xss(item.value) }))(body.parameters)
    product.images = R.map(xss)(body.images)

    try {
      await product.save()
      ctx.body = product

    } catch (e) {
      ctx.throw(501, e)
    }
  }

  @get('qiniu/token')
  async qiniuToken (ctx, next) {
    let key = ctx.query.key
    let token = qiniu.uptoken(key)

    ctx.body = {
      key: key,
      token: token
    }
  }

  @get('users')
  async dbUsers (ctx, next) {
    const res = await User.find({}).exec()

    ctx.body = res
  }

  @get('users/:id')
  async dbUser (ctx, next) {
    const id = ctx.params.id
    const res = await User.findOne({_id: id}).exec()

    ctx.body = res
  }

  @get('payments')
  async getPayments (ctx, next) {
    const res = await Payment
      .find({ success: 1 })
      .populate('product user')
      .exec()
    ctx.body = res
  }

  @post('login')
  @log
  @required({body: ['email', 'password']})
  async login (ctx, next) {
    const { email, password } = ctx.request.body

    try {
      var user = await User.findOne({ email: email }).exec()
      var match = null
      if (user) match = await user.comparePassword(password, user.password)
    } catch (e) {
      throw new Error(e)
    }
    
    if (match) {
      ctx.session.user = {
        _id: user._id,
        role: user.role,
        email: user.email,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl
      }

      return ctx.body = {
        ret: 0,
        user: {
          email: user.email,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl
        },
        msg: 'ok'
      }
    } 

    return ctx.body = {
      ret: 1,
      errors: {
        err: 'USER.WRONG_PASSWORD'
      }
    }   
  }

  @post('logout')
  async logout (ctx, next) {

  }

  @post('exam')
  @required({ body: ['openid', 'profession', 'house'] })
  async finishExam (ctx, next) {
    const sessionOpenid = ctx.session.openid
    const { openid, profession, house } = ctx.request.body

    if (sessionOpenid !== openid) ctx.throw(501, 'your openid is illegal!')

    let people = await ExamResult.findOne({ openid: openid }).exec()

    let resIntro = null
    let resImg = null

    if (people) {
      let elem = people.result.find(e => e.profession === profession)

      if (elem) {
        resIntro = elem.intro
        resImg = elem.imgUrl
      } else {
        let result = randomIntro(profession)
        resIntro = result.intro
        resImg = result.imgUrl

        let copyP = people.result.slice()
        copyP.push({
          profession: xss(profession),
          imgUrl: resImg,
          intro: resIntro
        })
        people.result = copyP
      }
    } else {
      let result = randomIntro(profession)
      resIntro = result.intro
      resImg = result.imgUrl

      people = {
        openid: xss(openid),
        result: [
          { profession: xss(profession), imgUrl: resImg, intro: resIntro }
        ]
      }
      people = new ExamResult(people)
    }

    try {
      await people.save()
      ctx.body = {
        success: true,
        data: {
          profession: profession,
          house: house,
          imgUrl: resImg,
          intro: resIntro
        }
      }
    } catch (e) {
      ctx.throw(501, e)
    }
  }
}
