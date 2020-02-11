<template lang="pug">
.container
  .exam-background

  .exam-main(v-for='(item, index) in question' v-if='index === step' :key='index')
    span.exam-back(v-if='item.back' @click='changeStep(index - 1)') < 上一步
    .exam-title {{ item.title }}
    .exam-content
      input.exam-content-input(v-if='item.input' v-model.trim='answer[item.inputKey]' @input='input')
      .exam-content-button(v-for='(btn, i) in item.buttons' @click='chooseAnswer(btn.key, btn.val)' :key='i') {{ btn.prefix ? btn.prefix + ' ' + btn.val : btn.val }}

  .exam-result(v-show='step === 3')
    transition(name='rotate')
      img.exam-vortex(v-if='animation.vortex' :src="imageCDN + 'images/exam-vortex.png'")

    transition(name='fade')
      span.exam-sign(v-if='animation.word') 正在穿越

    transition(name='crawl')
      .exam-card(v-if='animation.card')
        img(:src="imageCDN + 'images/' + answer.imgUrl")
        span.exam-card-title {{ answer.name }}.{{ answer.house }}.{{ answer.profession }}
        .exam-card-role 你是{{ answer.house }}的{{ answer.profession }}
        .exam-card-content {{ answer.intro }}
    
    transition(name='slide-top')
      .exam-download(v-if='animation.button' @click='previewImage') 下载来分享
</template>

<script>
import { mapState } from 'vuex'

export default {
  middleware: 'wechat-auth',
  head () {
    return {
      title: '穿越回冰火时代，你的结局是？',
      script: [
        { src: 'https://cdn.jsdelivr.net/howler.js/2.0.3/howler.min.js' }
      ]
    }
  },
  data () {
    return {
      step: 0,
      question: [
        {
          back: false,
          title: '输入你的名字',
          input: true,
          inputKey: 'name',
          buttons: [
            { val: '下一步', key: 'next' }
          ]
        },
        {
          back: true,
          title: '选择你的家族',
          input: false,
          buttons: [
            { val: '史塔克家族', key: 'house', prefix: 'A' },
            { val: '兰尼斯特家族', key: 'house', prefix: 'B' },
            { val: '提利尔家族', key: 'house', prefix: 'C' },
            { val: '拜拉席恩家族', key: 'house', prefix: 'D' },
            { val: '坦格利安家族', key: 'house', prefix: 'E' }
          ]
        },
        {
          back: true,
          title: '选择你的职业',
          input: false,
          buttons: [
            { val: '骑士', key: 'profession', prefix: 'A' },
            { val: '刺客', key: 'profession', prefix: 'B' },
            { val: '阴谋家', key: 'profession', prefix: 'C' },
            { val: '先知', key: 'profession', prefix: 'D' },
            { val: '女巫', key: 'profession', prefix: 'E' },
            { val: '法师', key: 'profession', prefix: 'F' }
          ]
        }
      ],
      answer: {
        name: '',
        house: '',
        profession: '',
        imgUrl: '',
        intro: ''
      },
      animation: {
        vortex: false,
        word: false,
        card: false,
        button: false
      },
      shareOpts: {
        title: '穿越回冰火时代，你的结局是？', // 分享标题
        desc: '', // 分享描述
        link: '', // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
        imgUrl: '', // 分享图标
        type: 'link', // 分享类型,music、video或link，不填默认为link
        dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
        success: () => {}, // 用户确认分享后执行的回调函数
        cancel: () => {} // 用户取消分享后执行的回调函数
      },
      previewImageUrl: ''
    }
  },
  computed: {
    ...mapState([
      'imageCDN',
      'authUser'
    ])
  },
  mounted () {
    const wx = window.wx
    const url = window.location.href

    this.shareOpts.desc = `${this.authUser ? this.authUser.nickname : '我'}在冰火中的结局竟然是...`
    this.shareOpts.link = url
    this.shareOpts.imgUrl = `${this.imageCDN}images/exam-vortex.png`

    this.$store.dispatch('getWechatSignature', url).then(res => {
      if (res.data.success === 1) {
        const params = res.data.params
        wx.config({
          debug: false, // 调试模式
          appId: params.appId, // 公众号的唯一标识
          timestamp: params.timestamp, // 生成签名的时间戳
          nonceStr: params.noncestr, // 生成签名的随机串
          signature: params.signature, // 签名
          jsApiList: [ 'previewImage', 'hideAllNonBaseMenuItem', 'showMenuItems' ]// 需要使用的JS接口列表: 预览图片接口，隐藏所有非基础按钮接口，批量显示功能按钮接口
        })
      }
    })

    wx.ready(() => {
      // config信息验证后会执行ready方法，所有接口调用都必须在config接口获得结果之后，config是一个客户端的异步操作，所以如果需要在页面加载时就调用相关接口，则须把相关接口放在ready函数中调用来确保正确执行。对于用户触发时才调用的接口，则可以直接调用，不需要放在ready函数中。
      wx.hideAllNonBaseMenuItem()// 隐藏所有非基础按钮
      wx.showMenuItems({
        // 要显示的菜单项
        menuList: [ 'menuItem:favorite', 'menuItem:share:appMessage', 'menuItem:share:timeline', 'menuItem:profile' ]
      })
      wx.onMenuShareTimeline(this.shareOpts) // 分享到朋友圈
      wx.onMenuShareAppMessage(this.shareOpts) // 分享给朋友
    })

    // 为文档根元素设置最小高度，防止输入框聚焦时 手机键盘上推而导致页面压缩
    const rootEl = document.documentElement
    rootEl.style.minHeight = rootEl.getBoundingClientRect().height + 'px'

    // 播放背景音乐
    const music = new window.Howl({
      src: [`${this.imageCDN}music/got.mp3`],
      loop: true,
      volume: 1
    })
    // Clear listener after first call
    music.once('load', () => {
      music.play()
    })
  },
  methods: {
    previewImage () {
      // 预览图片
      window.wx.previewImage({
        current: this.previewImageUrl, // 当前显示图片的http链接
        urls: [ this.previewImageUrl ] // 需要预览的图片http链接列表
      })
    },
    input () {
      // 控制输入框内容长度
      let obj = this.answer
      if (obj.name.length > 8) obj.name = obj.name.substr(0, 8)
      this.shareOpts.desc = obj.name ? `${obj.name}在冰火中的结局竟然是...` : `${this.authUser.nickname}在冰火中的结局竟然是...`
    },
    warning () {
      // 姓名输入为空时，为输入框添加警告动画Class
      let node = this.$el.getElementsByClassName('exam-content-input')[0]
      let oldClass = node.className
      if (oldClass.indexOf('exam-content-warning') !== -1) return
      node.className = `${oldClass} exam-content-warning`
      setTimeout(() => {
        node.className = oldClass
      }, 300)
    },
    chooseAnswer (key, val) {
      // 点击下一步或者选择答案
      if (key !== 'next') this.answer[key] = val
      // 姓名不为空时触发changeStep方法，未输入则触发warning方法，
      this.answer.name
        ? this.changeStep(this.step + 1)
        : this.warning()
    },
    changeStep (step) {
      // 更改步骤状态
      this.step = step
      let as = this.answer
      switch (step) {
        case 0:
          as.house = ''
          break
        case 3:
          this.getResult()
          break
      }
    },
    async getResult () {
      const res = await this.$store.dispatch('finishExam', {
        openid: this.authUser.openid,
        house: this.answer.house,
        profession: this.answer.profession
      })
      const { house, profession, imgUrl, intro } = res.data.data
      if (res.data.success) {
        this.answer.intro = `你是${house}的${profession}，${intro}`
        this.answer.imgUrl = imgUrl
        this.shareOpts.imgUrl = `${this.imageCDN}images/${imgUrl}`

        window.wx.onMenuShareTimeline(this.shareOpts)
        window.wx.onMenuShareAppMessage(this.shareOpts)

        this.finishExam()
      }
    },
    finishExam () {
      // 测试完成，触发一系列动画
      let obj = this.animation
      obj.vortex = true
      obj.word = true
      setTimeout(() => {
        obj.word = false
        obj.card = true
        obj.vortex = false
        setTimeout(() => {
          obj.button = true
        }, 6100)
      }, 1000)
    }
  }
}
</script>

<style scoped lang="sass" src='~static/sass/exam.sass'></style>
