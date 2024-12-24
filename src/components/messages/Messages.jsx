import React, { useEffect, useRef } from 'react'
import Message from './Message'
import useMessages from '../../zustand/useMessages';

const Messages = () => {
  const { messages } = useMessages();
  const lastMessageRef = useRef();

  console.log(messages);

  useEffect(() => {
    setTimeout(() => {
      lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100)

  }, [messages])

  return (
    <div className='flex flex-col h-full w-full overflow-auto px-4 py-4 rounded-lg'>
      {messages.length > 0 && messages.map((message) => (
        <div className='w-full' key={message.id} ref={lastMessageRef}>
          <Message message={message} />
        </div>
      ))}

      {messages.length === 0 && (
        <div className="flex flex-col h-full w-full items-center justify-center overflow-auto px-4 py-4 rounded-lg">
          <h3 className='text-2xl font-semibold  text-black text-center'>
            <span>Ask me questions about the <a className='link' href='https://www.congress.gov/bill/118th-congress/house-bill/10545/text/eh?format=txt'>most recent spending bill</a> in the United States.</span>
          </h3>
          <div className='overflow-y-auto'>
          <table className="table">
            {/* head */}
            <thead>
              <tr>
                <th>Question</th>
                <th>Answer</th>
              </tr>
            </thead>
            <tbody>
              {/* row 1 */}
              <tr>
                <th>How does H.R. 10545 address disaster relief, and which regions are designated to receive assistance?  </th>
                <td>H.R. 10545 addresses disaster relief by allocating $25,000,000 for infrastructure needs related to major disaster declarations under the Robert T. Stafford Disaster Relief and Emergency Assistance Act for the calendar years 2023 and 2024. The funding is designated for areas that have received a major disaster designation due to events such as hurricanes, wildfires, severe storms, and flooding. Specific regions are not detailed in the provided context.</td>
              </tr>
              {/* row 2 */}
              <tr>
                <th>What specific provisions does H.R. 10545 include to support farmers and agricultural producers?</th>
                <td>H.R. 10545 includes provisions for a one-time economic assistance payment to producers of eligible commodities during the crop year. It specifies that the expected gross return per acre for eligible commodities, such as wheat, corn, and soybeans, will be calculated based on projected average farm prices and national average harvested yields. Additionally, it extends certain provisions related to dairy margin coverage and other agricultural support measures.</td>
              </tr>
              {/* row 3 */}
              <tr>
                <th>How does H.R. 10545 impact the federal budget, and what are the implications for future government spending?</th>
                <td>H.R. 10545 impacts the federal budget by making further continuing appropriations for the fiscal year ending September 30, 2025, which may increase overall government spending. The bill includes significant allocations for disaster relief, infrastructure, and support for various sectors, potentially leading to higher deficits if not offset by revenue increases or spending cuts in other areas. The implications for future government spending could include ongoing financial commitments and the need for careful budget management to address the resulting fiscal challenges.</td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Messages