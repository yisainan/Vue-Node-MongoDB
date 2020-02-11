<template lang="pug">
</template>

<script>
function getUrlParam (param) {
  const reg = new RegExp('(^|&)' + param + '=([^&]*)(&|$)')
  const result = window.location.search.substr(1).match(reg)
  return result ? decodeURIComponent(result[2]) : null
}

export default {
  head () {
    return {
      title: 'loading'
    }
  },
  beforeMount () {
    const url = window.location.href

    this.$store.dispatch('getWechatOAuth', url).then(res => {
      const { data } = res
      console.log(data)
      if (data.success) {
        this.$store.dispatch('setAuthUser', data.user)
        const visit = '/' + getUrlParam('state')
        this.$router.replace(visit)
      } else {
        throw new Error('用户信息获取失败')
      }
    })
  }
}
</script>
