import config from '../config'

const tip = '我的卡丽熙/太阳，欢迎来到河间地\n' +
 '回复 1，穿越到到冰火查身份\n' +
 '回复 2，进入冰火手办商城\n' +
 '回复 3，获取最新的种子资源\n' +
 '回复 4，查看 9 大家族秘密\n' +
 '或者点击 <a href="' + config.SITE_ROOT_URL + '/exam">开始查身份</a>'

const bt = '权力的游戏 第六季 <a href="https://pan.baidu.com/s/1hsO4tl6">第一集</a>'


export default async (ctx, next) => {
  const message = ctx.weixin
  let mp = require('../wechat')
  let client = mp.getWechat()

  if (message.MsgType === 'event') {
    if (message.Event === 'subscribe') {
      ctx.body = tip
    } else if (message.Event === 'unsubscribe') {
      console.log('取关了')
    } else if (message.Event === 'LOCATION') {
      ctx.body = message.Latitude + ' : ' + message.Longitude
    } else if (message.Event === 'view') {
      ctx.body = message.EventKey + message.MenuId
    } else if (message.Event === 'pic_sysphoto') {
      ctx.body = message.Count + ' photos sent'
    } else if (message.Event === 'CLICK') {
      if (message.EventKey === 'bt') {
        console.log(1)
        ctx.body = bt
        console.log(2)
      }
    } else {
      ctx.body = tip
    }
    console.log(3)
  } else if (message.MsgType === 'text') {
    if (message.Content === '更新按钮吧') {
      const menu = require('./menu').default
      let menuMsg = '创建成功'

      try {
        await client.handle('delMenu')
      } catch (e) {
        console.log('删除菜单失败')
        console.log(e)

        menuMsg = '删除失败'
      }

      try {
        await client.handle('createMenu', menu)
      } catch (err) {
        console.log('创建菜单失败')
        console.log(err)
        menuMsg += menuMsg
      }

      ctx.body = menuMsg
    } else if (message.Content === 'bt' || message.Content === '3') {
      ctx.body = bt
    }

  } else if (message.MsgType === 'image') {
    ctx.body = {
      type: 'image',
      mediaId: message.MediaId
    }
  } else if (message.MsgType === 'voice') {
    ctx.body = {
      type: 'voice',
      mediaId: message.MediaId
    }
  } else if (message.MsgType === 'video') {
    ctx.body = {
      type: 'video',
      mediaId: message.MediaId
    }
  } else if (message.MsgType === 'location') {
    ctx.body = message.Location_X + ' : ' + message.Location_Y + ' : ' + message.Label
  } else if (message.MsgType === 'link') {
    ctx.body = [{
      title: message.Title,
      description: message.Description,
      picUrl: 'http://mmbiz.qpic.cn/mmbiz_jpg/xAyPZaQZmH09wYBjskFEQSoM4te0SnXR9YgbJxlDPVPDZtgLCW5FacWUlxFiaZ7d8vgGY6mzmF9aRibn05VvdtTw/0',
      url: message.Url
    }]
  }
}
