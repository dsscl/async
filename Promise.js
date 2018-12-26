// 3、Promise对象和Deferred对象
// Promise/get-jqeury1.4.js
$.get('/mydata', {
    success: onSuccess,
    failure: onFailure,
    always: onAlways
})
// Promise/get-jquery1.5.js
var promise = $.get('/mydata')
promise.done(onSuccess)
promise.fail(onFailure)
promise.always(onAlways)
// 有什么好处，一言以蔽之：封装
// Promise对象也和EventEmitter对象一样，允许向同一个事件绑定任意多的处理器（堆积技术）
// 对于多个Ajax调用分享某个功能小片段（譬如“正加载”动画）的情况，堆积技术也会使降低代码重复度容易很多

// 不过使用Promise对象的最大优势仍然在于，它可以轻松从现有Promise对象派生出新的Promise对象

// 3.1Promise极简史

// 3.2生成Promise对象
// 假设我们提示用户应敲击Y键或N键，为此要做的第一件事就是生成一个$.Deferred实例以代表用户做出的决定
var promptDeferred = new $.Deferred()
promptDeferred.always(function() {console.log('A choice was made:')})
promptDeferred.done(function() {console.log('Starting game...')})
promptDeferred.fail(function() {console.log('No game today.')})
// (ps: always关键字仅适用于jquery 1.6+)
// Deferred就是Promise！
// 更准确的说，Deferred是Promise的超集，它比Promise多了一项关键特性：可以直接触发
// 纯Promise实例只允许添加多个调用，而且必须由其他什么东西来触发这些调用

// 使用resolve（执行）方法和reject（拒绝）方法均可触发Deferred对象
$('#playGame').focus().on('keypress', function(e) {
    var Y = 121, N = 110
    if(e.keyCode === Y) {
        promptDeferred.resolve()
    } else if(e.keyCode === N) {
        promptDeferred.reject()
    } else {
        return false // 这里的Deferred对象保持着挂起状态
    }
})
// 敲击Y键，控制台：
>A choice was made
>Starting game
// 执行了Deferred（即对Deferred对象调用了resolve方法）之后，即运行该对象的always（恒常）回调和done（已完成）回调（会按照绑定回调的次序来运行回调，而不是巧合）
// 敲击N键
>A choice was made
>No game today
// 对Deferred对象调用了reject方法之后，即运行该对象的always回调和fail（失败）回调。若最后绑定的是always回调，则控制台的输出顺序相反

// 再试着反复敲击Y键和N键，再也没有反应了
// 因为Promise只能执行或拒绝一次，之后就失效了
// 我们断言，Promise对象会一直保持挂起状态，直到被执行或拒绝
// 对Promise对象调用state（状态）方法，可以查看其状态是"pending"、"resolved"，还是"rejected"（到jquery1.7才添加了state方法，此前的版本使用的是isResolved和isRejected

// 如果正在进行的一次性异步操作的结果可以笼统地分成两种（如成功/失败，或接受/拒绝），则生成Deferred对象就能直观地表达这次任务

// 3.2.1生成纯Promise对象
// 刚刚了解到Deferred对象也是Promise对象，那么，如何得到一个不是Deferred对象的Promise对象呢？
// 很简单，对Deferred对象调用promise方法即可

// ps: 对于已执行或已拒绝的Promise对象，CommonJS的Promises/A规范及其实现中使用了一种更合理的说法：
// Promise对象已履行（关键字为fulfill）或已拒绝，这两种情况都称Promise已执行

var promptPromise = promptDeferred.promise()
// promptPromise只是promptDeferred对象的一个没有resolve/reject方法的副本
// 我们把回调绑定至Deferred或其下辖的Promise并无不同，因为这两个对象本质上分享着同样的回调
// 它们也分享着同样的state（返回的状态值为“pending”、“resolved”或“rejected”）
// 这意味着，对同一个Deferred对象生成多个Promise对象是毫无意义的。事实上，jquery给出的只不过是同一个对象
var promise1 = promptDeferred.promise()
var promise2 = promptDeferred.promise()
console.log(promise1 === promise2) // true
// 而且，对一个纯Promise对象再调用promise方法，产生的只不过是一个指向相同对象的引用
console.log(promise1 === promise1.promise()) // true
// 使用promise方法的唯一理由就是“封装”。
// 如果传递promptPromise对象，但保留promptDeferred对象为己所用，则可以肯定的是，除非是你自己想触发那些回调，否则任何回调都不会被触发

// 重申一下，每个Deferred对象都含有一个Promise对象，而每个Promise对象都代表着一个Deferred对象
// 有了Deferred对象，就可以控制其状态，而有了纯Promise对象，只能读取其状态及附加回调

// 3.2.2jquery API中的Promise对象
// Ajax是演示Promise的绝佳用例：每次对远程服务器的调用都或成功或失败，而我们希望以不同的方式来处理这两种情况
// Promise也同样适用于本地的一些异步操作，譬如动画

// 在jquery中，任何动画方法都可以接受传入的回调，以便在完成动画时发出通知
$('.error').fadeIn(afterErrorShown)

// 在jquery1.6+中，可以转而要求jquery对象生成Promise，后者代表了这个动画已附加动画的完成情况，即是否完成了目前正处于挂起状态的动画
var errorPromise = $('.error').fadeIn().promise()
errorPromise.done(afterErrorShown)

// 对同一个jquery对象附加的多个动画会排入队列按照顺序运行，仅当调用promise方法之时已入列的全部动画均已执行之后，相应的Promise对象才会执行
// 因此，这会产生两个不同的、按顺序执行的Promise对象（或者根本就不执行，若先调用stop方法的话）
var $falsh = $('.flash')
var showPromise = $falsh.show().promise()
var hidePromise = $falsh.hide().promise()

// 在jquery1.6及jquery1.7中，jquery对象的promise方法只是一种权宜之计
// 如果使用Deferred对象的resolve方法作为动画的回调，即可轻松生成一个行为完全相同的动画版Promise对象
var slideUpDeferred = new $.Deferred()
$('.menu').slideUp(slideUpDeferred.resolve)
var slideUpPromise = slideUpDeferred.promise()

// jquery1.8新添了一种Promise资源：
// $.ready.promise()也能生成一个Promise对象，并且当文档就绪时即执行该对象
$(onReady)
$(document).ready(onReady)
$.ready.promise().done(onReady)

// 本节介绍了如何获得jquery中的Promise对象：或者生成一个$.Deferred实例（这会带来一个可自行控制的Promise）
// 或者进行一次可返回Promise对象的API调用

// 3.3向回调传递数据
// Promise对象可以向其回调提供额外的信息
// 例：下面两个Ajax代码片段是等效的
// 直接使用回调
$.get(url, successCallback)
// 将回调绑定至Promise对象
var fetchingData = $.get(url)
fetchingData.done(successCallback)

// 执行或拒绝Deferred对象时，提供的任何参数都会转发至相应的回调
var aDreamDeferred = new $.Deferred()
aDreamDeferred.done(function(subject) {
    console.log('I had the most wonderful dream about', subject)
})
aDreamDeferred.resolve('the JS event model')
>I had the most wonderful dream about the JS event model

// 还有一些特殊的方法能实现在特定上下文中运行回调（即将this设置为特定的值）：resolveWith和rejectWith
// 此时只需传递上下文环境作为第一个参数，同时以数组的形式传递所有其他参数
var slashdotter = {
    comment: function(editor) {
        console.log('Obviously', editor, 'is the best text editor.')
    }
}
var grammarDeferred = new $.Deferred()
grammarDeferred.done(function(verb, object) {
    this[verb](object)
})
grammarDeferred.resolveWith(slashdotter, ['comment', 'Emacs'])
>Obviously Emacs is the best text editor

// 然而，将参数打包成数组是很痛苦的。所以有个窍门，不再使用resolveWith/rejectWith，而是直接在目标上下文中调动resolve/reject方法
// 这是因为resolve/reject可以直接将其上下文环境传递至自己所触发的回调
// 因此，对于前面那个例子，使用以下代码亦可得到同样的结果
grammarDeferred.resolve.call(slashdotter, 'comment','Emacs')

// 3.4进度通知
// Promise对象是你希望任务结束时发生的一些事
// 但是，过程和结果同样重要
// jquery团队意识到这一点并遵守Promise/A规范，于是在jquery1.7中为Promise对象新添了一种可以调用无数次的回调，这个回调叫做progreess（进度）
// 例：假设有人正在奋力达成美国全国小说写作月(NaNoWriMon)项目设定的日均码子目标，而我们希望更新一个指示器以反映他距离实现这个目标还有多远
var nanowrimoing = $.Deferred()
var wordGoal = 5000
nanowrimoing.progress(function(wordCount) {
    var percentComplete = Math.floor(wordCount / wordGoal * 100)
    $('#indicator').text(percentComplete + '% complete')
})
nanowrimoing.done(function () {
    $('#indicator').text('Good job!')
})
// Deferred对象的nanowrimoing准备就绪之后，可以像下面这样对字数的变化作出响应
$('#document').on('keypress', function() {
    var wordCount = $(this).val().split(/\s+/).length
    if(wordCount >= wordGoal) {
        nanowrimoing.resolve()
    }
    nanowrimoing.notify(wordCount)
})
// Deferred对象的notify（通知）调用会调用我们设定的progress回调，就像resolve和reject一样，notify也能接受任意参数
// 注意，一旦执行了nanowrimoing对象，则再作nanowrimoing.notify调用将不会有任何反应，这就像任何额外的resolve调用及reject调用也会被直接无视一样
// 简单总结一下，Promise对象接受3种回调形式：done、fail和progress
// 执行Promise对象时，运行的是done回调；拒绝Promise对象时，运行的是fail回调；对处于挂起状态的Deferred对象调用notify时，运行的是progress回调

// 3.5Promise对象的合并
// 进度通知的存在并没有改变每个Promise对象的最终状态为已执行或已拒绝这一事实（否则，Promise对象将永远保持挂起状态）
// 为什么呢？为什么不让Promise对象随时变化成任意的状态，而偏偏只有这两种状态呢

// 这样设计Promise，其主要原因是程序员一直都在跟二进制打交道
// 码农非常清楚如何把1和0揉捏起来建成令人瞠目结舌的逻辑之塔
// Promise如此强大的一个主要原因就是，它允许我们把任务当成布尔值来处理

// Promise对象的逻辑合并技术有一个常见的用例：判断一组异步任务何时完成
// 假设我们正在播放一段演示视频，同时又在加载服务器上的一个游戏，我们希望这两件事一旦结束（对次序没有要求）就马上启动游戏
// 演示视频播放完毕
// 游戏已加载完毕
// 这两个进程各用一个Promise对象来表示，我们的任务就是在这两个Promise均已执行时启动游戏
// 下面隆重介绍jquery的when方法！
var gameReadying = $.when(tutorialPromise, gameLoadedPromise)
gameReadying.done(startGame)
// when相当于Promise执行情况的逻辑与运算符（AND）
// 一旦给定的所有Promise均已执行，就立即执行when方法产生的Promise对象
// 或者，一旦给定的任意一个Promise被拒绝，就立即拒绝when产生的Promise
// when方法的绝佳用例是合并多重Ajax调用
// 假设需要马上进行两次post调用，而且要在这两次调用都成功时收到通知，这时就无需再为每次调用请求分别定义一个回调
$.when($.post('/1', data1), $post('/2', data2))
.then(onPosted, onFailure)
// 调用成功时，when可以访问下辖的各个成员Promise对象的回调参数，不过这么做很复杂
// 这些回调参数会当作参数列表进行传递，传递的次序和成员Promise对象传递给when方法时一样
// 如果某个成员Promise对象提供多个回调参数，则这些参数会先转换成数组
// 因此，要想根据赋予$.when方法的所有成员Promise对象获得全部回调参数，可能会写出像下面这样的代码（笔者不推荐）
$.when(promise1, promise2)
.done(function(promise1Args, promise2Args) {
    //...
})
// 这个例子中，如果执行promise1时用到了一个参数'complete'，执行promise2时用到了3个参数（1、2、3），
// 则promise1Args就是字符串'complete'，promise2Args就是数组[1,2,3]
// 虽然有可能，但如果不是绝对必要，我们不应该自行解析when回调的参数，相反应该直接向那些传递至when方法的成员Promise对象附加回调来收集相应的结果
var serverData = {}
var getting1 = $.get('/1')
.done(function(result) {serverData['1'] = result})
var getting2 = $.get('/2')
.done(function(result) {serverData['2'] = result})
$.when(getting1, getting2)
.done(function() {
    // 获得的信息现在都已位于serverData...
})

// 函数的Promise用法
// $.when及其他能取用Promise对象的jquery方法均支持传入非Promise对象作为参数
// 这些非Promise参数会被当成因相应参数位置已赋值而执行的Promise对象来处理，例如：
$.when('foo') // 会生成一个因赋值'foo'而立即执行的Promise对象

var promise = $.Deferred().resolve('manchu')
$.when('foo', promise) // 会生成一个因赋值'foo'和'manchu'而立即执行的Promise对象代码

var promise = $.Deferred().resolve(1,2,3)
$.when('test', promise) // 会生成一个因赋值'test'和数组[1,2,3]而立即执行的Promise对象

// 记住，Deferred对象传递多个参数给resolve方法时，$.when会把这些参数转换成一个数组
// 这带来一个问题：$.when如何知道参数是不是Promise对象呢？
// 答案是：jQuery负责检查$.when的各个参数是否带有promise方法，如果有就使用该方法的返回值
// Promise对象的promise方法会直接返回自身

// 如3.2.2节所描述，jQuery对象也可以有promise方法，这意味着$.when方法强行将那些带promise方法的jQuery对象转换成了jQuery动画版Promise对象
// 因此，如果想生成一个在抓取某些数据且已完成#loading动画之后执行的Promise对象，只需写下下面这样的代码：
var fetching = $.get('/myData')
$.when(fetching, $('#loading'))
// 请记住，必须在动画开始之后再执行$.when生成的那个Promise对象。
// 如果#loading的动画队列为空，则立即执行相应的Promise对象

// 3.6管道连接未来
// 在JavaScript中常常无法便捷地执行一系列异步任务，一个主要原因是无法在第一个任务结束之前就向第二个任务附加处理器
// 例，假设我们要从一个url抓取数据（GET），接着又将这些数据发送给另一个url（POST）
var getPromise = $.get('/query')
getPromise.done(function(data) {
    var postPromise = $.post('/search', data)
})
// 现在我们想给postPromise附加处理器...

// 看到问题了吗？在GET操作成功之前我们无法对postPromise对象绑定回调，因为这时postPromise对象还不存在！
// 除非我们已经得到因$.get调用而异步抓取的数据，否则甚至无法进行那个负责生成postPromise对象的$.post调用

// 这正是jQuery1.6为Promise对象新增的pipe（管道）方法的原因
// pipe好像在说：“请针对这个Promise对象给我一个回调，我会归还一个Promise对象以表示回调运行的结果。”
var getPromise = $.get('/query')
var postPromise = getPromise.pipe(function(data) {
    return $.post('/search', data)
})
// 看起来像黑魔法，对吧？下面是详情大揭秘：
// pipe最多能接受3个参数，它们对应着Promise对象的3种回调：done、fail、和progress
// 也就是说，我们在上述例子中只提供了执行getPromise时应运行的那个回调
// 当这个回调返回的Promise对象已经执行/拒绝时，pipe方法返回的那个新Promise对象也就可以执行/拒绝
// 从效果上看，pipe就是通向未来的一扇窗户！

// 我们可以通过修改pipe回调参数来“滤清”Promise对象
// 如果pipe方法的回调返回值不是Promise/Deferred对象，它就会变成回调参数
// 例，假设有个Promise对象发出的进度通知表示成0与1之间的某个数，则可以使用pipe方法生成一个完全相同的Promise对象，
// 但它发出的进度通知却转变成可读性更高的字符串
var promise2 = promise1.pipe(null, null, function(progress) {
    return Math.floor(progress*100)+'% complete'
})
// 总的来说，pipe的回调可以做以下两件事情：
// 1）如果pipe回调返回的是Promise对象，则pipe生成的那个Promise对象会模仿这个Promise对象
// 2）如果pipe回调返回的是非Promise对象（值或空白），则pipe生成的那个Promise对象会立即因该赋值而执行、拒绝或得到通知
// 具体取决于调用pipe的那个初始Promise对象刚刚发生了什么

// pipe判定参数是否为Promise对象的方法和$.when完全一样：
// 如果pipe的参数带有promise方法，则该方法的返回值会被当作Promise对象以代表调用pipe的那个初始Promise对象
// 再重申一次，promise.promise() === promise

// 管道级联技术
// pipe方法并不要求提供所有的可能回调。事实上，我们通常只想写成这样：
var pipedPromise = originalPromise.pipe(successCallback)
// 或是这样：
var pipedPromise = originalPromise.pipe(null, failCallback)
// 我们能看出初始Promise对象（即originalPromise）在成功/失败之后应触发的回调（第一种情况下因任务成功而触发successCallback,第二种情况下因任务失败而触发failCallback）
// 所以管道末尾的Promise（即pipedPromise）行为取决于successCallback/failCallback的返回值
// 但是，如果并没有在pipe方法种为初始Promise的任务结果指定回调，又该怎么办呢？

// 很简单，管道末尾的Promise在这些情况下直接模仿那个初始Promise对象
// 我们可以这样说：初始Promise对象的行为一直级联到管道末尾的Promise对象
// 这种级联技术非常有用，因为它让我们不费吹灰之力就能定义异步任务的分化逻辑
// 假设有这样一个分成3步走的进程
var step1 = $.post('/step1', data1)
var step2 = step1.pipe(function() {
    return $.post('/step2', data2)
})
var lastStep = step2.pipe(function() {
    return $.post('/step3', data3)
})
// 这里的lastStep对象当且仅当所有这3个Ajax调用都成功完成时才执行，其中任意一个Ajax调用未能完成，lastStep均被拒绝
// 如果只在乎整体进程，则可以省略掉前面的变量声明
var posting = $.post('/stpe1', data1)
    .pipe(function() {
        return $.post('/step2', data2)
    })
        .pipe(function() {
            return $.post('/step3', data3)
        })
// 也可以让后面的pipe嵌套在前面那个pipe的里面
var posting = $.post('/stpe1', data1)
.pipe(function() {
    return $.post('/step2', data2)
    .pipe(function() {
        return $.post('/step3', data3)
    })
})
// 当然，这会重现金字塔厄运。
// jQuery Promise到此结束，接下来简单介绍一下其主要替代方案：
CommonJS的Promise/A规范及其旗舰版实现Q.js


// 3.7jquery与Promise/A的对比
// 两者的区别只是在形式上，即用相同的词语表示不同的含义
// jQuery使用resolve作为fail的反义词，而Promise/A使用的是fulfill
// 在Promise/A规范中，Promise对象不管是已履行还是已失败，都称“已执行”
// jQuery1.8问世之前，jQuery的then方法只是一种可以同时调用done、fail和progress这3种回调的速写法，而Promise/A的then在行为上更像是jQuery的pipe
// jquery1.8订正了这个问题，使得then称为pipe的同义词，不过，由于向后兼容的问题，jquery的Promise再如何对Promise/A示好也不太会招人待见

// 还有一些其他细微的差别

// 3.8用Promise对象代替回调函数
// 理想情况下，开始执行异步任务的任何函数都应该返回Promise对象
// 遗憾的是，大多数Javascript API（包括所有浏览器及Node.js均使用的那些原生函数）都基于回调函数，而不是基于Promise对象
// 在本节中，我们将看到如何在基于回调函数的API中使用Promise对象

// 在基于回调函数的API中使用Promise对象的最直接的办法是，生成一个Deferred对象并传递其触发器函数作为API的回调参数
// 例如，我们可以把Deferred对象的resolve方法传递给一个像setTimeout这样的简单异步函数
var timing = new $.Deferred()
setTimeout(timing.resolve, 500)
// 考虑到API可能会出错，还要写一个根据情况指向resolve或reject的回调函数
// 例，我们会这样写Node风格的回调：
var fileReading = new $.Deferred()
fs.readFile(filename, 'utf8', function(err) {
    if(err) {
        fileReading.reject(err)
    } else {
        fileReading.resolve(Array.prototype.slice.call(arguments, 1))
    }
})
// 工具函数以根据任何给定Deferred对象来生成Node风格的回调
deferredCallback =  function(deferred) {
    return function(err) {
        if(err) {
            deferred.reject(err)
        } else {
            deferred.resolve(Array.prototype.slice.call(arguments, 1))
        }
    }
}
// 有了这个工具函数，前面那个例子就可以写成：
var fileReading = new $.Deferred()
fs.readFile(filename, 'utf8', deferredCallback(fileReading))
// Q.js的Deferred对象为此提供了一个现成的node方法：
var fileReading = Q.defer()
fs.readFile(filename, 'utf8', fileReading.node())

// 3.9小结
// Promise是过去几年中jquery最激动人心的新特性之一
// 窥见js的未来，返回Promise对象的JavaScript API越多，这些API就越有吸引力
