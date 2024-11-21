import { connect } from 'react-redux';
import './index.scss';

import TransparentBox from '@/components/transparentBox/page';


import { Fragment } from 'react';

function MiddleGreeting(props: { [propName: string]: any }) {
  const greeting = () => {
    const h = new Date().getHours();
    if (h >= 4 && h < 11) return '上午好';
    else if (h >= 11 && h < 14) return '中午好';
    else if (h >= 14 && h < 18) return '下午好';
    else return '晚上好';
  };


  return (
    <TransparentBox>
      <div className="middle_greeting">
        <div className="greeting">
          {greeting()}，
          {props.isLogin ? (
            props.name
          ) : (
            <span
              className="underline_button"
            >
              登陆
            </span>
          )}
        </div>
        <div className="random_song">
          {props.isLogin ? (
            <Fragment>
              <span
                className="underline_button"
            
              >
                获取私人雷达歌单
              </span>
              <span
                className="underline_button"
              >
                退出当前登陆账号
              </span>
            </Fragment>
          ) : (
            <span>登陆解锁更多功能</span>
          )}
        </div>
        <div className="control_box">
          <span>当前正播放</span>
      
        </div>
      </div>
    </TransparentBox>
  );
}


export default MiddleGreeting;

