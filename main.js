const BASE_URL = "https://lighthouse-user-api.herokuapp.com"
const INDEX_URL = BASE_URL + "/api/v1/users"
const userdataPanel = document.querySelector("#user-list-zone")
const Paginator = document.querySelector(".pagination")
const topRank = document.querySelector(".list-group")
const MEMBERS_PER_PAGE = 12
//網頁開啟時直接出現所有User
//用來裝原始API資料
let userData = []
//searchBar用
let filterUserData = []
//篩選男女用
let genderData = []
//用戶點擊行為歷史資料
let userHistorialData = JSON.parse(localStorage.getItem("userClickStatus")) || []
//渲染網頁主要資料流
let renderData = []

//資料合併函式
function concatData() {
  //渲染用資料
  for (let i = 0; i < userData.length; i++) {
    const concatData = { ...userData[i], ...userHistorialData[i] }
    renderData.push(concatData)
  }
}

//第一次使用初始化userData資料，加上點擊狀態、點讚數和新用戶狀態
function inicializeData() {
  let userInitialStatus = {
    clickTimes: 0,
    likes: 0,
    newStatus: "",
    favoriteMark: "fa-regular",
  }
  renderData.forEach((item, index, arr) => {
    const newObj = { ...item, ...userInitialStatus }
    arr[index] = newObj
  })
}


//axios非同步請求結束，頁面刷新重整用
axios.get(INDEX_URL).then((response) => {
  const result = response.data.results;
  userData = [...result]
  concatData()
  //如果是第一次使用，初始化資料
  if (userHistorialData.length === 0) {
    inicializeData()
  }
  renderPaginator(renderData)
  rankTopUser(renderData)
  renderUserList(getMemberByPage(1))

})



function renderUserList(data) {
  let rawHTML = ``;
  data.forEach((item) => {
    //放入literal template
    //資訊 id name surname avatar(img)
    rawHTML += `
    <div class="mb-2 mx-1 personal-block col-md-2 col-lg-3" data-id=${item.id}>
         <div class="img-span position-relative d-flex justify-content-center">
         <img class="user-img-main card-img-top" data-bs-toggle="modal"
              data-bs-target="#user-modal-img" data-id="${item.id}"
            src=${item.avatar} alt="user-poster">
            <!--NEW訊息提示框-->
             <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger fs-6 ${item.newStatus} new-alert" data-id="${item.id}">
    NEW
    <span class="visually-hidden">unread messages</span>
  </span>
   <!--NEW訊息提示框結束-->
          </div>
          <div id="card-footer" class="card-footer d-flex flex-start">
          <span style="font-size: 1.3rem;">${item.name}</span>
            <i class="${item.favoriteMark} fa-heart ms-2" style="font-size: 1.5rem"; data-id="${item.id}"></i>
            <i class="fa-regular fa-thumbs-up ms-3" style="font-size: 1.5rem" data-id="${item.id}"></i>
        </div>
        </div>`;
  });
  userdataPanel.innerHTML = rawHTML;
}
function showUserModal(id) {
  const modalName = document.querySelector("#user-modal-name")
  const modalRegion = document.querySelector("#modal-region")
  const modalBirthday = document.querySelector("#modal-birthday")
  const modalEmail = document.querySelector("a.email")
  const modalAge = document.querySelector("#modal-age")
  const modalGender = document.querySelector("#modal-gender")
  const modalupDate = document.querySelector("#modal-update")

  //以本地端第一次呼叫資料取得modal資料
  const clickUser = userData.find(data => data.id === id)
  modalName.innerText = clickUser.name + " " + clickUser.surname;
  modalRegion.innerText = `Region: ${clickUser.region}`
  modalBirthday.innerText = `Birthday: ${clickUser.birthday}`
  modalEmail.innerText = `${clickUser.email}`
  modalAge.innerText = `Age: ${clickUser.age}`
  modalGender.innerText = `Gender: ${clickUser.gender}`
  modalupDate.innerText = `recently update: ${clickUser.updated_at.substr(0, 10)}`
}

//加入喜歡的使用者至最愛清單，並推入localStorage
function addFavoriteMember(id) {
  const list = JSON.parse(localStorage.getItem("favoriteMember")) || []
  const member = userData.find((user) => user.id === id)
  if (list.some((user) => user.id === id)) {
    return alert("這位使用者已在您的最愛清單中唷~!")
  }
  list.push(member)
  localStorage.setItem("favoriteMember", JSON.stringify(list))
  rankTopUser(renderData)
}
//刪除已經不喜歡的使用者，並從localStorage將資料去除
function removeFavoriteMember(id) {
  favoriteData = JSON.parse(localStorage.getItem("favoriteMember"))
  const memberIndex = favoriteData.findIndex((user) => user.id === id)
  favoriteData.splice(memberIndex, 1)
  localStorage.setItem("favoriteMember", JSON.stringify(favoriteData))
  rankTopUser(renderData)
}


//成員清單內容綁定監聽器
userdataPanel.addEventListener("click", function OnPanelClick(e) {

  if (e.target.matches(".user-img-main")) {
    const userID = Number(e.target.dataset.id)
    const clickUserIndex = renderData.findIndex((user) => user.id === Number(e.target.dataset.id))
    showUserModal(userID)
    renderData[clickUserIndex].clickTimes += 1
    renderData[clickUserIndex].newStatus = "visually-hidden"
    e.target.nextElementSibling.classList.add("visually-hidden")
    rankTopUser(renderData)
  }
  //點到加入我的最愛
  if (e.target.matches(".fa-heart")) {
    const clickUserIndex = renderData.findIndex((user) => user.id === Number(e.target.dataset.id))
    renderData[clickUserIndex].clickTimes += 1
    renderData[clickUserIndex].newStatus = "visually-hidden"
    e.target.parentElement.previousElementSibling.lastElementChild.classList.add("visually-hidden")
    //如果加入最愛
    if (!e.target.matches(".fa-solid")) {
      e.target.classList.add("fa-solid")
      e.target.classList.remove("fa-regular")
      //記得存入暫存renderData資料，不然換頁會洗掉愛心
      renderData[clickUserIndex].favoriteMark = "fa-solid"
      addFavoriteMember(Number(e.target.dataset.id))
    }

    //直接移除最愛，消掉愛心
    else {
      e.target.classList.remove("fa-solid")
      e.target.classList.add("fa-regular")
      //記得存入暫存renderData資料，不然換頁會洗掉愛心
      renderData[clickUserIndex].favoriteMark = "fa-regular"
      removeFavoriteMember(Number(e.target.dataset.id))

    }
    localStorage.setItem("userClickStatus", JSON.stringify(renderData))
  }
  //點到按讚+1
  if (e.target.matches(".fa-thumbs-up")) {
    const clickUserIndex = renderData.findIndex((user) => user.id === Number(e.target.dataset.id))
    renderData[clickUserIndex].clickTimes += 1
    renderData[clickUserIndex].likes += 1
    renderData[clickUserIndex].newStatus = "visually-hidden"
    e.target.parentElement.previousElementSibling.lastElementChild.classList.add("visually-hidden")
    localStorage.setItem("userClickStatus", JSON.stringify(renderData))
    rankTopUser(renderData)
  }
});

function getMemberByPage(page) {
  const startIndex = MEMBERS_PER_PAGE * (page - 1)
  const endIndex = startIndex + MEMBERS_PER_PAGE
  //修改條件式 可從userFilterData,renderData和genderData變動
  let data = []
  //資料流程條件控制
  if (filterUserData.length > 0) {
    data = filterUserData
  }
  else if (genderData.length > 0) {
    data = genderData
  }
  else if (renderData.length > 0) {
    data = renderData
  }
  return data.slice(startIndex, endIndex)
}

function renderPaginator(data) {
  //需要先清掉舊有pageniator結構(search顯示用)
  const liNodes = Paginator.querySelectorAll(".page-item-number")
  liNodes.forEach(item => {
    item.remove()
  })
  const totalPageNumber = Math.ceil(data.length / MEMBERS_PER_PAGE)
  for (let i = totalPageNumber; i > 0; i--) {
    let rawHTML = document.createElement("li")
    rawHTML.innerHTML = `<a class="page-link" href="#" data-id=${i}>${i}</a>`
    rawHTML.classList.add('page-item-number')
    Paginator.firstElementChild.after(rawHTML)
  }
}

//分頁器監聽器
let clickPage = [1]
Paginator.addEventListener('click', function OnPaginatorClick(event) {
  event.preventDefault()
  //設定分頁器最後一頁號碼
  const finalPageNumber = Paginator.childElementCount - 2

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

  if (!filterUserData.length) {
    return alert("抱歉~沒有吻合的使用者名稱!")
  }

  renderPaginator(filterUserData)
  renderUserList(getMemberByPage(1))
})




//likes數資料排行並渲染至網頁(熱門部落客Top-3)
function rankTopUser(data) {
  //按讚數矩陣資料排序
  const oderRankData = data.sort((a, b) => b.likes - a.likes)
  //取前3名渲染至top-3網頁部分
  const medaliconUrl = ["./gold.png", "./sliver.png", "./bronze.png",]
  let rawHTML = `<h3>本周熱門部落客 Top-3</h3>`
  for (let i = 0; i < 3; i++) {
    rawHTML +=
      `<li class="list-group-item mb-2 like-rank d-flex felx-column" data-id="601">
      <img class="like-rank-1" src="${medaliconUrl[i]}">
        <img class="user-rank-img" src="${oderRankData[i].avatar}">
          <p class="name mx-1">${oderRankData[i].name}</p>
          <i class="far fa-thumbs-up"></i>
          <p class="likes-times mx-1">${oderRankData[i].likes}</p>
          <i class="fa-regular fa-hand-pointer mx-1"></i>
          <p class="click-times mx-1">${oderRankData[i].clickTimes}</p>
        </li>`
  }
  topRank.innerHTML = rawHTML

}

//blooger篩選男女監聽器
const blogGender = document.querySelector("#gender-pic")
blogGender.addEventListener("click", function onClickGender(event) {
  const gender = event.target.dataset.id;
  filterUserData = [];

  if (gender === "boy") {
    genderData = renderData.filter((user) => user.gender === "male");
  } else if (gender === "girl") {
    genderData = renderData.filter((user) => user.gender === "female");
  }

  renderPaginator(genderData);
  renderUserList(getMemberByPage(1));
})



