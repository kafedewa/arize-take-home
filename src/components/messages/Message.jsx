import React from 'react'
import filledIcon from '../../assets/person-square-fill-svgrepo-com.svg'
import unfilledIcon from '../../assets/person-square-svgrepo-com.svg'

const Message = ({message}) => {
  const fromMe = message.role == "user";
  const pic = fromMe ? filledIcon : unfilledIcon;
  const bubbleBgColor = fromMe ? 'bg-black' : 'bg-base-200';
  const bubbleTxtColor = fromMe ? 'text-white' : 'text-black';

  return (
    <div className={`chat w-full chat-start`}>
        <div className="chat-image w-8 avatar placeholder">
            <img src={pic}/>
        </div>
        <div className={`chat-bubble  ${bubbleTxtColor} ${bubbleBgColor}`}>{message.message} </div>
    </div>
  )
}

export default Message