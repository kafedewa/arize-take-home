import Messages from './Messages'
import MessageInput from './MessageInput'



const MessageContainer = () => {

  return (
    <div className='flex h-dvh w-screen pt-12 flex-col'>
        <Messages/>
        <MessageInput/>
    </div>
  )
}

export default MessageContainer;