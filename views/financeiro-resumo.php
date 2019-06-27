<?php include('includes/header-medico.php'); ?>

<section class="box__panel">
	<div class="container">
		<div class="row mosaic">
			<div class="col-md-12">
				<div class="mosaic-item cards">
					<div class="selectresumo">
						<h1 class="tituloresumo" >Período</h1>
						<select class="periodoresumo"  name="" id="">
							<option value="">Hoje</option>
							<option value="">Esta semana</option>
							<option value="">Este mês</option>
							<option value="">Últimos 30 dias</option>
							<option value="" type="date">Periodo</option>
						</select>
					</div>
				</div>
			</div>
			<div class="col-md-6">
				<div class="mosaic-item cards transta">
					<h1 class="tituloresumo" >Transações</h1>
					<a class="btn-receitaresumo" id="corbtn" ><i class="fas fa-arrow-up"></i> RECEITA</a>
				  <a class="btn-despesasresumo" id="corbtn" ><i class="fas fa-arrow-down"></i> DESPESA</a>
					<a class="btn btn-transresumo"><i class="fas fa-exchange-alt"></i> TRANSFERÊNCIA</a>
					<div class="saldo">
				  <hr>
					<h1 class="tituloresumo" >Saldo Geral</h1>
					<p id="colorsalgeral" >R$ 0,00</p>
					<hr>
				</div>
				</div>
			</div>
			<div class="col-md-3">
				<div class="mosaic-item cards">
					<h1 class="tituloresumo" >Receitas x Convênio</h1>
					<div class="donut-chart-block block">
											<div class="donut-chart">
				 <div id="porcion1" class="recorte"><div class="quesito ios" data-rel="39"></div></div>
				 <div id="porcion2" class="recorte"><div class="quesito mac" data-rel="39"></div></div>

												<a class="center-date" id="center">10 MIl<br><span>Receitas</span></a>
											</div>
											<ul class="os-percentages horizontal-list">
													<li>
															<p class="ios os scnd-font-color">Receitas</p>
															<p class="os-percentage">21<sup>%</sup></p>
													</li>
													<li>
															<p class="mac os scnd-font-color">Convênio</p>
															<p class="os-percentage">39<sup>%</sup></p>
													</li>
											</ul>
									</div>
				</div>
			</div>
			<div class="col-md-3">
				<div class="mosaic-item cards">
					<h1 class="tituloresumo" >Receitas x Procedimento</h1>
      <div class="donut-chart-block block">
									<div class="donut-chart">
		 <div id="porcion1" class="recorte"><div class="quesito ios" data-rel="39"></div></div>
	   <div id="porcion2" class="recorte"><div class="quesito mac" data-rel="39"></div></div>

										<a class="center-date" id="center">4 MIl<br><span>Receitas</span></a>
									</div>
									<ul class="os-percentages horizontal-list">
											<li>
													<p class="ios os scnd-font-color">Receitas</p>
													<p class="os-percentage">21<sup>%</sup></p>
											</li>
											<li>
													<p class="mac os scnd-font-color">Procedimento</p>
													<p class="os-percentage">39<sup>%</sup></p>
											</li>
									</ul>
							</div>
				</div>
			</div>

			<div class="col-md-12">
				<div class="mosaic-item">
					<h1 class="tituloresumo" >Balanço</h1>
			<div class="bar-chart-block block">
         <div class='grafico bar-chart'>
           <ul class='eje-y'>
             <li data-ejeY='60'></li>
             <li data-ejeY='45'></li>
             <li data-ejeY='30'></li>
             <li data-ejeY='15'></li>
             <li data-ejeY='0'></li>
          </ul>
       <ul class='eje-x'>
         <li data-ejeX='37'><i>España</i></li>
         <li data-ejeX='56'><i>Portugal</i></li>
         <li data-ejeX='25'><i>Italia</i></li>
         <li data-ejeX='18'><i>Grecia</i></li>
         <li data-ejeX='45'><i>EE.UU</i></li>
         <li data-ejeX='50'><i>México</i></li>
         <li data-ejeX='33'><i>Chile</i></li>
       </ul>
    </div>
  </div>
				</div>
			</div>
			<div class="col-md-6">
				<div class="mosaic-item">
					<h1 class="tituloresumo" >Receitas pendentes no período</h1>
					<p id="colorsalgeral" ><i class="fas fa-arrow-down"></i> R$ 0,00</p>
					<a href="" class="btn btn-gradient">VER MAIS</a>
				</div>
			</div>
			<div class="col-md-6">
				<div class="mosaic-item ">
					<h1 class="tituloresumo" >Despesas pendentes no período</h1>
					<p id="colorsalgeral" ><i class="fas fa-arrow-up"></i> R$ 0,00</p>
					<a href="" class="btn btn-gradient">VER MAIS</a>
				</div>
			</div>
		</div>
	</div>
</section>
<?php include('includes/footer.php'); ?>
