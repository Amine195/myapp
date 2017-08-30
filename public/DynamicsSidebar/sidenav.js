(function(){
    let path = document.querySelector("#sidebar-wave path")
    let sidebarLinks = document.querySelectorAll('.sidebar a')
    let from = path.getAttribute('d')
    let to = path.dataset['to']
    let options = {
        type: dynamics.easeOut,
        duration: 450,
        friction:450
    }
    


    let sidebarOpened = false
    let button = document.querySelector('#menu')
    button.addEventListener('click', function(e){
        e.stopPropagation()
        e.preventDefault()
        document.body.classList.add('has-sidebar')

        dynamics.animate(path,{
            d: to  
            }, options)
        sidebarLinks.forEach(function(link, i){
            dynamics.animate(link, {
                translateX: 0
            }, Object.assign({}, options, {delay: 50 * i, duration: 300}))
        })
        sidebarOpened = true
    })
    
    document.body.addEventListener('click', function(){
        if(sidebarOpened){
            document.body.classList.remove('has-sidebar')

            dynamics.animate(path,{
                d: from  
            }, options)
        sidebarLinks.forEach(function(link, i){
            dynamics.animate(link, {
                translateX: 200
            }, options)
        })
        }
    })
})()