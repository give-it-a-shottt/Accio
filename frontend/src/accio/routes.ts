/** 쇼핑몰 안 주소(해시 라우팅). accioHref() → '#/', accioHref('/list') → '#/list' */
export function accioHref(path = '') {
  return `#${path || '/'}`
}
