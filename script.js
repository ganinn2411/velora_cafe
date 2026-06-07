function seedIfEmpty() {
  // Eğer hafıza bozulmuşsa veya kullanıcılar hiç yüklenmediyse zorla sıfırla
  if (!localStorage.getItem("aura_users") || localStorage.getItem("aura_users") === "[]") {
    localStorage.clear(); // Eski tüm hatalı kalıntıları kökten siler
    
    // Orijinal Kullanıcıları Yükle
    localStorage.setItem("aura_users", JSON.stringify([
      { id:"u1", name:"Müdür Kerem",   role:"admin",   pin:"1234", avatar:"K" },
      { id:"u2", name:"Barista Efe",   role:"barista", pin:"1111", avatar:"E" },
      { id:"u3", name:"Barista Ayşe",  role:"barista", pin:"2222", avatar:"A" }
    ]));

    // Orijinal Masaları Yükle
    localStorage.setItem("aura_tables", JSON.stringify([
      { id:"t1", num:1, zone:"Salon", status:"free", activeOrderId:null },
      { id:"t2", num:2, zone:"Salon", status:"free", activeOrderId:null },
      { id:"t3", num:3, zone:"Salon", status:"free", activeOrderId:null },
      { id:"t4", num:4, zone:"Teras", status:"free", activeOrderId:null },
      { id:"t5", num:5, zone:"Teras", status:"free", activeOrderId:null },
      { id:"t6", num:6, zone:"Bahçe", status:"free", activeOrderId:null },
      { id:"t7", num:7, zone:"Bahçe", status:"free", activeOrderId:null },
      { id:"t8", num:8, zone:"Bahçe", status:"free", activeOrderId:null }
    ]));

    // Orijinal Başlangıç Menüsünü Yükle
    localStorage.setItem("aura_menu", JSON.stringify([
      { id:1,  emoji:"☕", name:"Espresso",       price:65,  category:"Espresso Bazlı", desc:"Yoğun, saf espresso",          popular:false },
      { id:2,  emoji:"🖤", name:"Americano",      price:75,  category:"Espresso Bazlı", desc:"Espresso + sıcak su",           popular:true  },
      { id:3,  emoji:"🤍", name:"Cappuccino",     price:95,  category:"Espresso Bazlı", desc:"Espresso + köpüklü süt",        popular:true  },
      { id:4,  emoji:"🥛", name:"Latte",          price:100, category:"Espresso Bazlı", desc:"Espresso + buharlanmış süt",    popular:false },
      { id:5,  emoji:"⬜", name:"Flat White",     price:108, category:"Espresso Bazlı", desc:"Yoğun espresso + microfoam",    popular:true  },
      { id:12, emoji:"🧊", name:"Iced Latte",     price:110, category:"Soğuk Kahve",     desc:"Buzlu espresso ve soğuk süt", popular:true  },
      { id:18, emoji:"🍰", name:"San Sebastian",  price:145, category:"Atıştırmalık",    desc:"Akışkan kıvamlı efsane lezzet",popular:true  }
    ]));

    localStorage.setItem("aura_orders", JSON.stringify([]));
    console.log("AURA POS: Veritabanı başarıyla sıfırlandı ve kuruldu.");
  }
}
