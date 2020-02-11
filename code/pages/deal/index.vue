<template lang="pug">
.container
  .focus-goods-body
    .focus-goods-swiper(v-swiper='swiperConfig')
      .swiper-wrapper
        .swiper-slide(v-for='item in product.images')
          img(:src="imageCDN + item")
          
      .swiper-pagination.swiper-pagination-bullets
    
    .focus-goods-content
      
      .focus-goods-price
        span.focus-goods-price_main {{ product.price.toFixed(2) - product.price.toFixed(2).substr(-3) }}
        span.focus-goods-price_others {{ product.price.toFixed(2).substr(-3) }}
      
      .focus-goods-name {{ product.title }}

      .focus-goods-intro {{ product.intro }}

      .focus-goods-info
        cell(v-for='(item, index) in product.parameters' :key='index' :title='item.key' :content='item.value')

      .focus-goods-attentions
        .title 购买提示
        ol
          li(v-for='item in attentions') {{ item }}

  .focus-goods-footer
    span(@click='payHandle') 购买
</template>

<script>
import cell from '~components/cell.vue'
import { mapState } from 'vuex'

export default {
  middleware: 'wechat-auth',
  head () {
    return {
      title: '手办详情'
    }
  },
  data () {
    return {
      swiperConfig: {
        autoplay: 4000,
        direction: 'horizontal',
        loop: true,
        pagination: '.swiper-pagination'
      },
      attentions: [
        '商品和服务差异',
        '物流配送'
      ],
      swipeOptions: {
        startSlide: 0,
        speed: 300,
        auto: 4000,
        continuous: true,
        disableScroll: false,
        stopPropagation: false,
        callback: function (index, slide) { console.log('slide changes') },
        transitionEnd: function (index, slide) { console.log('slide transition ends') }
      }
    }
  },
  computed: {
    ...mapState({
      imageCDN: 'imageCDN',
      product: 'focusProduct'
    })
  },
  methods: {
    payHandle () {
      const wx = window.wx
      const url = window.location.href

      this.$store.dispatch('getWechatSignature', url).then(res => {
        if (res.data.success === 1) {
          const params = res.data.params
          wx.config({
            debug: true, // 调试模式
            appId: params.appId, // 公众号的唯一标识
            timestamp: params.timestamp, // 生成签名的时间戳
            nonceStr: params.noncestr, // 生成签名的随机串
            signature: params.signature, // 签名
            jsApiList: [ 'chooseWXPay' ]// 需要使用的JS接口列表: 微信支付接口
          })
          wx.ready(() => {
            wx.chooseWXPay({
              timestamp: params.timestamp, // 支付签名时间戳，注意微信jssdk中的所有使用timestamp字段均为小写。但最新版的支付后台生成签名使用的timeStamp字段名需大写其中的S字符
              nonceStr: params.nonceStr, // 支付签名随机串，不长于 32 位
              package: params.package, // 统一支付接口返回的prepay_id参数值，提交格式如：prepay_id=***）
              signType: params.signType, // 签名方式，默认为'SHA1'，使用新版支付需传入'MD5'
              paySign: params.paySign, // 支付签名
              success: (res) => {
                try {
                  window.WeixinJSBridge.log(res.err_msg)
                } catch (e) {
                  console.error(e)
                }
                if (res.err_msg === 'get_brand_wcpay_request:ok') {
                  // 支付成功
                } else {}
              }
            })
          })
        }
      })
    }
  },
  beforeCreate () {
    const id = this.$route.query.id
    this.$store.dispatch('focusProduct', id)
  },
  components: {
    cell
  }
}
</script>

<style scoped lang="sass" src='~static/sass/deal.sass'></style>
