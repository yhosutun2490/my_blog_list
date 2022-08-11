const BASE_URL = "https://lighthouse-user-api.herokuapp.com"
const INDEX_URL = BASE_URL + "/api/v1/users"
const userdataPanel = document.querySelector("#user-list-zone")
const paginator = document.querySelector(".pagination")
const members_per_Page = 10
//我的最愛資料端由localStorage取出
let userData = JSON.parse(localStorage.getItem("favoriteMember"))
let filterUserData = []
if (userData === null) {
  userData = []
}

renderPaginator(userData)
renderUserList(getMemberByPage(1))


function renderUserList(data) {
  let rawHTML = ``;
  if (data.length > 0)
    data.forEach((item) => {
      //放入literal template
      //資訊 id name surname avatar(img)
      rawHTML += `
    <div class="personal-block col-3 mb-1">
       <div class="img-span position-relative d-flex justify-content-center">
         <img class="user-img-main" data-bs-toggle="modal"
              data-bs-target="#user-modal-img" data-id="${item.id}"
            src=${item.avatar} alt="user-poster">
          </div>
          <div class="card-footer d-flex flex-start">
          <span style="font-size: 1.3rem;">${item.name}</span>
            <i class="fa-solid fa-heart-crack dislike" style="font-size: 1.5rem"; data-id="${item.id}"></i>
        </div>
        </div>`
    })
  else {
    rawHTML += `<div id="no-members-note" class="text-center">There are no members in yours Favorite Lists</div> `
  }
  userdataPanel.innerHTML = rawHTML
}
function showUserModal(id) {
  const modalName = document.querySelector("#user-modal-name");
  const modalRegion = document.querySelector("#modal-region");
  const modalBirthday = document.querySelector("#modal-birthday");
  const modalEmail = document.querySelector("a.email");
  const modalAge = document.querySelector("#modal-age");
  const modalupDate = document.querySelector("#modal-update");
  //呼叫API回傳資料
  axios.get(INDEX_URL + "/" + id).then((response) => {
    const data = response.data;
    modalName.innerText = data.name + " " + data.surname;
    modalRegion.innerText = `Region: ${data.region}`;
    modalBirthday.innerText = `Birthday: ${data.birthday}`;
    modalEmail.innerText = `${data.email}`;
    modalAge.innerText = `Age: ${data.age}`;
    modalupDate.innerText = `recently update: ${data.updated_at.substr(0, 10)}`;
  });
}

//刪除已經不喜歡的使用者，並從localStorage將資料去除
function removeFavoriteMember(id) {
  const userClickStatus = JSON.parse(localStorage.getItem("userClickStatus"))
  const clickIndex = userClickStatus.findIndex((user) => user.id === id)
  const memberIndex = userData.findIndex((user) => user.id === id)
  userData.splice(memberIndex, 1)
  localStorage.setItem("favoriteMember", JSON.stringify(userData))
  //記得存入userClickStatus資料，不然從favorite轉回主頁愛心會重新出現
  userClickStatus[clickIndex].favoriteMark = "fa-regular"
  localStorage.setItem("userClickStatus", JSON.stringify(userClickStatus))
  renderUserList(userData)
}


//成員清單綁定監聽器
userdataPanel.addEventListener("click", function OnPanelClick(e) {
  if (e.target.matches(".user-img-main")) {
    showUserModal(Number(e.target.dataset.id))
  }
  if (e.target.tagName === "I") {
    removeFavoriteMember(Number(e.target.dataset.id))
  }
});

function getMemberByPage(page) {
  const startIndex = members_per_Page * (page - 1)
  const endIndex = startIndex + members_per_Page
  const data = filterUserData.length ? filterUserData : userData
  return data.slice(startIndex, endIndex)
}

function renderPaginator(data) {
  //需要先清掉舊有pageniator結構(search顯示用)
  const liNodes = paginator.querySelectorAll(".page-item-number")
  liNodes.forEach(item => {
    item.remove()
  })
  const totalPageNumber = Math.ceil(data.length / members_per_Page)
  for (let i = totalPageNumber; i > 0; i--) {
    let rawHTML = document.createElement("li")
    rawHTML.innerHTML = `<a class="page-link" href="#" data-id=${i}>${i}</a>`
    rawHTML.classList.add('page-item-number')
    paginator.firstElementChild.after(rawHTML)
  }
}

//分頁器監聽器
let clickPage = [1]
paginator.addEventListener('click', function OnPaginatorClick(event) {
  event.preventDefault()
  //設定分頁器最後一頁號碼
  const finalPageNumber = paginator.childElementCount - 2

  if (event.target.tagName === "A") {
    const pageNumber = Number(event.target.innerText)
    if (!isNaN(pageNumber)) {
      clickPage.push(pageNumber)
      renderUserList(getMemberByPage(pageNumber))
    }
    else if (event.target.innerText === 'Pre') {
      const prePageNumber = clickPage.pop()
      const nextPageNumber = prePageNumber - 1
      if (nextPageNumber === 0) {
        clickPage = [1]
        alert("已經到達第一頁了!!")
        renderUserList(getMemberByPage(1))
      }
      else {
        clickPage.push(nextPageNumber)
        renderUserList(getMemberByPage(nextPageNumber))
      }
    }
    else if (event.target.innerText === 'Next') {
      const prePageNumber = clickPage.pop()
      const nextPageNumber = prePageNumber + 1
      if (nextPageNumber > finalPageNumber) {
        clickPage = [finalPageNumber]
        alert("已經到達最後一頁了!!")
        renderUserList(getMemberByPage(finalPageNumber))
      }
      else {
        clickPage.push(nextPageNumber)
        renderUserList(getMemberByPage(nextPageNumber))
      }
    }
  }
})

const searchForm = document.querySelector("#search-form")
const input = document.querySelector("#search-input")
//search表單綁定監聽器
searchForm.addEventListener('submit', function onSubmitForm(event) {
  event.preventDefault()
  const keyword = input.value.trim().toLowerCase()
  if (!keyword.length) {
    alert("記得輸入有效搜尋名稱喔!")
  }
  filterUserData = userData.filter((item) =>
    item.name.toLowerCase().includes(keyword) ||
    item.surname.toLowerCase().includes(keyword)
  )
  console.log(filterUserData)

  if (!filterUserData.length) {
    return alert("抱歉~沒有吻合的使用者名稱!")
  }

  renderPaginator(filterUserData)
  renderUserList(getMemberByPage(1))
})

