// fnpApp is defined in fnp.js

fnpApp.constant('SERVICE_URL','/control/')
.controller('CartCntrl',CartCntrl)
.factory("CartService",CartService);


fnpApp.directive('triggerjqueryeventsforcartsummary', [ '$timeout', function($timeout) {
	return {
		link : function($scope, element, attrs) {
			$scope.$on('dataloadedforsummary', function() {
				$timeout(function() { // You might need this timeout to be sure its run after DOM render.
					initCurrencies();
				}, 0, false);
			})
		}
	};
} ]);

/**
 * Cart Model or Services
 */


 function navigation()
 {
 	alert("hello welcome to our page");
 }

function CartService($resource){
	return {
		//getReqParamsForAddToCart:getReqParamsForAddToCart,
		removeCartItem:removeCartItem,
		removeCartAddons:removeCartAddons,
		storeDeliveryAddress:storeDeliveryAddress,
		applyCouponCode:applyCouponCode,
		removeCouponCode:removeCouponCode,
		fetchCartItems:fetchCartItems,
		cartItemCount:cartItemCount,
	};
	function cartItemCount(){
		var countUrl="https://" + secureHostNameToUse + '/control/cartItemCount';
		 var resource = $resource(countUrl).save();
		 resource.global = false;
		 return resource.$promise;
	} 
	function fetchCartItems(fetchURL){
		var request = $resource(fetchURL);
		request.global = false;
		return request.get().$promise;
	}
	
	function applyCouponCode(appyCouponURL){
		//var resource = $resource(SERVICE_URL + '/applyCouponCode');
        //return resource.save(param).$promise;
        var request = $resource(appyCouponURL);
		return request.save().$promise;
	}
	
	function removeCouponCode(removeCouponURL){
        var request = $resource(removeCouponURL);
		return request.save().$promise;
	}
	
	function storeDeliveryAddress(param){
		 var resource = $resource(SERVICE_URL + '/storeDeliveryAddress');
		 return resource.save(param).$promise;
	
	}
	
	function removeCartItem(deleteURL)
	{	
		var request = $resource(deleteURL);
		return request.save().$promise;
	}
	
	function removeCartAddons(deleteURL)
	{	var request = $resource(deleteURL);
		return request.save().$promise;
	}
	
}		

/**
 * Cart Controller
 */
function CartCntrl($window,$location,$scope,CartService,LoginService,$rootScope){
	var app=this;
	
	app.submitForm = function(formObj, formId){
	     if(formObj.$valid) {
	    	 var submitButton = $("#"+ formId).find("input[type='submit']");
	    	 if(submitButton){
		    	 submitButton.prop('disabled', true);
		    	 submitButton.addClass("loadinggif");
	    	 }
	    	 jQuery("#" + formId).submit();
  	 }else{		 	 
  		formObj.$submitted = true;
		var $firstEle = angular.element(".ng-invalid:eq(1)");
		if($firstEle) {
				$(window).scrollTop($firstEle.offset().top-$firstEle.height()-100);
		}
        event.preventDefault();		  
		}
	 };
    var discountAmount = $window.discountAmount;
    discountAmount = parseInt(discountAmount);
    if(discountAmount == 0){
    	app.validDiscount = false;
    }else{
    	app.validDiscount = true;
    }
	app.showcoupon=false;
	app.showcouponform=$window.showcouponform;
	app.couponCode=$window.couponCode;
	app.showdiscount = $window.showdiscount;
	app.showremove = $window.showremove;
	$rootScope.cart={};
	app.showAdjustmentForm  = $window.showAdjustmentForm;
	app.adjustmentAmountToshow = $window.adjustmentAmountToshow;
	app.updateCartCount=function(){
		CartService.cartItemCount().then(function(response){
			$rootScope.cartCount=response.carttotalquantity;
			$("#cartCount").text(response.carttotalquantity);
		});
	};
	
	$rootScope.$on('cartcount',function(){
		app.updateCartCount();
	});
	
	
	app.currentUrl=null;
	app.getCart=function(){
		var url = $location.absUrl();
		var currentUrl = url.split('/');
		app.currentUrl = currentUrl[currentUrl.length-1];
		CartService.fetchCartItems('https://' + secureHostNameToUse + '/control/viewcart').then(function(data){
			$rootScope.cart=data;
			if(fnpPageType == 'cartsummary' || app.currentUrl == 'cartsummary'){
				console.log("you may also like CALLED");
				//youMayAlsoLike(data);
			}
			app.updateCartCount();
			if(data.items.length == 0){
				$('#youmayalsolike').empty();
			}
			$rootScope.$broadcast('dataloadedforsummary');
		}, app.fetchFailed);
		
	};

	if(fnpPageType == 'cartsummary' || app.currentUrl == 'cartsummary'){
		app.getCart();
	}
	
	app.modifyCart=function(index){
		var confirmation = confirm("Are you sure you want to delete? ");
		if(confirmation){
				var cartProdIndex = $("#cartItemProd_"+index).val();
				params = 'DELETE_'+cartProdIndex;
				ajaxindicatorstart('');
				CartService.removeCartItem('https://'+ secureHostNameToUse + '/control/deleteitem?'+params).then(function(data){app.getCart();ajaxindicatorstop();}, app.fetchFailed);
			}
		}
	
	app.fetchFailed= function(error){
		console.log("Error occured while fetching shopping cart items from the server.");
	};
	app.applycoupon=function (param){	
      ajaxindicatorstart('');
	  app.couponCode = param;
	  CartService.applyCouponCode('/control/applyCouponCode?productPromoCodeId='+param).then(function(data){
		  if(data!=null && data.isSuccess){
			  app.showcoupon=false;
			  app.showcouponform=false;
			  //app.showdiscount=!app.showdiscount;
			  app.showremove = true;
			  //Reloading the page just to reflect the changes in the UI which are updated in the cart.
			  location.reload();
		  }else{
			  var errorMsg = data.errorMsg;
			  if(errorMsg == undefined){
				  errorMsg = "The coupon code is not valid. Please try another code";
				  console.log("MSG = "+errorMsg);
				  $(".couponError").html(errorMsg);
				  $(".couponError").show().fadeOut(4000); 
			  }else{
				  console.log("MSG = "+errorMsg);
				  $(".couponError").html(errorMsg);
				  $(".couponError").show().fadeOut(4000);
			  }
              ajaxindicatorstop();
		  }
          
	  }, "");
	};
	
	app.removecoupon=function (param){
        ajaxindicatorstart('');
		  CartService.removeCouponCode('/control/removePromotion?promoCode='+param).then(function(data){
				  location.reload();
		  }, "");
	};
	
	app.addAdjustment = function (param){
		  app.couponCode = param;
		  CartService.applyCouponCode('/control/addManualAdjustMent?amount='+param).then(function(data){
			  if(data!=null && data.isSuccess){
				  app.showAdjustmentForm=false;
				  //Reloading the page just to reflect the changes in the UI which are updated in the cart.
				  location.reload();
			  }else{
				  var errorMsg = data.errorMsg;
				  $(".adjustmenterror").html(errorMsg);
				  $(".adjustmenterror").show();
			  }
		  }, "");
		};
	
	app.removeAdjustment=function (formId){
				jQuery("#"+formId).submit();
			  /*CartService.removeCouponCode('/control/removeManualAdjustMent?orderId='+orderId).then(function(data){
				  if(data!=null && data.isSuccess){
					  location.reload();
				  }else{
					// In case of any error also reloading to make sure the changes effected or not.
					  location.reload();
				  }
			  }, "");*/
		};
		
		 
}



function getMinPrice(queryItems){
	//TODO later these value comes from properties file
	var MIN_PERCENT = 10;
	var minPrice = parseInt(queryItems[0].price);
	for(var i=0;i<queryItems.length;i++){
		var itemPrice =parseInt(queryItems[i].price);
		if(minPrice > itemPrice)minPrice = itemPrice;
	}
	minPrice = minPrice - (minPrice*MIN_PERCENT/100);
	return minPrice.toString();
}

function getMaxPrice(queryItems){
	//TODO later these value comes from properties file
	var MAX_PERCENT = 10;
	var maxPrice = parseInt(queryItems[0].price);
	for(var i=0;i<queryItems.length;i++){
		var itemPrice = parseInt(queryItems[i].price);
		if(maxPrice < itemPrice)maxPrice = itemPrice;
	}
	maxPrice = maxPrice + (maxPrice*MAX_PERCENT/100);
	return maxPrice.toString();
}


function prepareQuery(queryItems){
	console.log(queryItems);
	var query = "viewSize=5,";
	for(var i=0;i<queryItems.length;i++){
		query += "fq=!PRODUCT_ID:"+queryItems[i].productId+",";
	}
	query += "fq=PRICE_INR:["+getMinPrice(queryItems)+" TO "+getMaxPrice(queryItems)+"],";
	query += "productId="+queryItems[0].productId;
	console.log(query);
	return query;
}

function youMayAlsoLike(queryData){
  if(queryData.items.length != 0){	
	  		var query = prepareQuery(queryData.items);
		    var queryString = query.split(",");
			$.each(jQuery.deparam.querystring(), function(index, value) {
			  	queryString.push(index+"="+value);
			});
		    var queryStringObject = jQuery.deparam.querystring(queryString.join("&"),true);
		    var finalQueryString = $.param.querystring("?",queryStringObject,0);
		    console.log('called me');
		    console.log("/control/youmayalsolike"+finalQueryString);
		    //TODO: construct query string with filters
		    $("#youmayalsolike").load(AJAX_JSON_URL_LIST.youMayAlsoLikeUrl.concat(finalQueryString));
		}
	}


// actual js tarts from here //////

function abc()
{
	alert("Hello welcome");
}


$("#abc").click(function(){
    abc();
});


// actual js ends here /////