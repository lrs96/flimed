<?php include('includes/header-medico.php'); ?>

<section class="box__panel">
	<div class="container">
		<div class="row mosaic">
			<div class="col-md-12">
		<div class="financeiro__box">
			<div class="financeiro__title">
				<h3>Extrato</h3>

<div class="form-filter fin-r">
	<div class="select">
						<i class="sprite-form__filter"></i>
						<select name="" id="" class="select-icon">
							<option value="">Filtrar</option>
							<option value="">Este mês</option>
							<option value="">Descrição</option>
							<option value="">Categoria</option>
							<option value="">Centro de custo</option>
							<option value="">Conta</option>
							<option value="">Convênio</option>
							<option value="">Forma de pagamento</option>
							<option value="">Paciente</option>
							<option value="">Procedimento</option>
							<option value="">Profissional de saúde</option>
							<option value="">Satus</option>
							<option value="">Tipo</option>
						</select>
					</div>
	        <a href="#"  class="btn btn-pdf"><i class="fas fa-print"></i></a>
	        <a href="#transferencia"  data-fancybox="tranferencia" class="btn btn-pdf"><i class="fas fa-exchange-alt"></i></a>
					<a href="#saidadecaixa"  data-fancybox="saidadecaixa" class="btn btn-pdf">Despesas</a>
					<a href="#entradasdecaixa"  data-fancybox="entradasdecaixa" class="btn btn-excel">Receitas</a>

				</div>

			<div class="cadastro-box">
			<div  class="form-cadastro profissional-saude active">
               <table style="    border-bottom: dashed 1px; border-bottom-color: #e6e6e6" class="table table-dashed">
					<thead>
					<tr>
						<th scope="col">DATA</th>
						<th scope="col">DESCRIÇÃO</th>
						<th scope="col">CATEGORIA</th>
						<th scope="col">VALOR</th>
						<th scope="col">SALDO</th>
						<th scope="col">AÇÕES</th>
					</tr>
				</thead>
					<tr>
						<td>10/10/2020</td>
						<td>Exemplo</td>
						<td>Exemplo</td>
						<td>R$ 1200,00</td>
						<td>R$ 1200,00</td>
						<td><a href="" class="btn-gradient">EXCLUIR</a></td>
						<td><a href="" class="btn-gradient">VER MAIS</a></td>
					</tr>
					<tr>
						<td>10/10/2020</td>
						<td>Exemplo</td>
						<td>Exemplo</td>
						<td>R$ 1200,00</td>
						<td>R$ 1200,00</td>
						<td><a href="" class="btn-gradient">EXCLUIR</a></td>
						<td><a href="" class="btn-gradient">VER MAIS</a></td>
					</tr>
					<tr>
						<td>10/10/2020</td>
						<td>Exemplo</td>
						<td>Exemplo</td>
						<td>R$ 1200,00</td>
						<td>R$ 1200,00</td>
						<td><a href="" class="btn-gradient">EXCLUIR</a></td>
						<td><a href="" class="btn-gradient">VER MAIS</a></td>
					</tr>
				</tbody>
			</table>
			</div>
			</div>
			</div>
		</div>
			</div>
			<div class="col-md-6">
				<div class="mosaic-item cards">
						<P class="extratoresumop" >Resumo do período <span class="extratoresumospan" >(01/05/19 - 31/05/19)</span></P>
						<p class="extratoresumop" >Total de transações: <span class="extratoresumospan" >0</span></p>
						<hr id="extratoresumohr">
						<p class="extratoresumop">Receitas pendentes:  <span class="extratoresumospan" >0</span> <span class="extratoresumospan" >R$ 0,00</span></p>
 						<p class="extratoresumop">Despesas pendentes:  <span class="extratoresumospan" >0-</span> <span class="extratoresumospan" >R$ 0,00</span></p>
					</div>
				</div>
			<div class="col-md-6">
				<div class="mosaic-item cards">
					<P class="extratoresumop" >Total de receitas
						<span class="extratoresumospan" >R$ 0,00</span>
					</P>
					<p class="extratoresumop" >Total de despesas
						<span class="extratoresumospan" > - R$ 0,00</span>
					</p>
					<hr id="extratoresumohr">
					<p class="extratoresumop">Total do período
						<span class="extratoresumospan" >R$ 0,00</span>
					</p>
				</div>
			</div>
		</div>
		</div>
	</div>
</section>

<!-- Modal transferência  -->
<div style="width: 70%; " class="modal" id="transferencia">
	<div style="width: 100%" class="modal-box">
		<div class="modal-title">
			<h2>Transferência</h2>
		</div>
		<div class="form">
			<form action="">
				<div class="row">
					<div class="col-md-6">
						<input type="text" name="" placeholder="Valor">
					</div>
					<div class="col-md-6">
						<input type="date" name="" placeholder="Data">
					</div>
					<div class="col-md-12">
						<input type="text" name="" placeholder="Descrição">
					</div>
					<div class="col-md-6">
						<input type="text" name="" placeholder="Origem">
						<a href="#novaconta"  data-fancybox="novaconta" class="adicionarextato" >CADASTRAR NOVO ITEM</a>
					</div>
					<div class="col-md-6">
						<input type="text" name="" placeholder="Destino">
						<a href="#novacontadestino"  data-fancybox="novacontadestino" class="adicionarextato" >CADASTRAR NOVO ITEM</a>
					</div>
					<div class="col-md-4">
						<input style="margin-top: 30px;" type="submit" class="btn btn-gradient" value="Salvar">
					</div>
			</form>
		</div>
	</div>
</div>
</div>
<!-- Modal transferência fim -->

<!--Modal adicionar nova conta  -->
<div style="width: 70%; " class="modal" id="novaconta">
	<div style="width: 100%" class="modal-box">
		<div class="modal-title">
			<h2>Nova Conta</h2>
		</div>
		<div class="form">
			<form action="">
				<div class="row">
					<div class="col-md-6">
						<input type="text" name="" placeholder="Nome">
					</div>
					<div class="col-md-6">
						<input type="text" name="" placeholder="Saldo inicial">
					</div>
					<div class="col-md-3">
						<input type="submit" class="btn btn-gradient" value="Adicionar">
					</div>
					<div class="col-md-3">
						<input type="submit" class="btn btn-pdf" value="Cancelar">
					</div>
			</form>
		</div>
	</div>
</div>
</div>
<!--Modal adicionar nova conta  fim -->

<!--Modal adicionar nova conta destino  -->
<div style="width: 70%; " class="modal" id="novacontadestino">
	<div style="width: 100%" class="modal-box">
		<div class="modal-title">
			<h2>Nova Conta Destino</h2>
		</div>
		<div class="form">
			<form action="">
				<div class="row">
					<div class="col-md-6">
						<input type="text" name="" placeholder="Nome">
					</div>
					<div class="col-md-6">
						<input type="text" name="" placeholder="Saldo inicial">
					</div>
					<div class="col-md-3">
						<input type="submit" class="btn btn-gradient" value="Adicionar">
					</div>
					<div class="col-md-3">
						<input type="submit" class="btn btn-pdf" value="Cancelar">
					</div>
			</form>
		</div>
	</div>
</div>
</div>
<!--Modal adicionar nova conta destino  fim -->

<div style="width: 70%; " class="modal" id="saidadecaixa">
	<div style="width: 100%" class="modal-box">
		<div class="modal-title">
			<h2>Despesas</h2>
		</div>
		<div class="form">
			<form action="">
				<div class="row">
					<div class="col-md-12">
						<input type="text" name="" placeholder="Paciente">
					</div>
					<div class="col-md-4">
						<input type="text" name="" placeholder="Profissional">
					</div>
					<div class="col-md-4">
						<input type="text" name="" placeholder="Convênio">
					</div>
					<div class="col-md-4">
						<input type="text" name="" placeholder="Procedimento">
					</div>
					<div class="col-md-4">
						<input type="text" name="" placeholder="Valor">
					</div>
					<div class="col-md-4">
						<input type="text" name="" placeholder="Descrição">
					</div>
					<div class="col-md-4">
						<input type="text" name="" placeholder="Categoria">
					</div>
					<div class="col-md-4">
						<input type="text" name="" placeholder="Conta">
						<a href="#parcelar"  data-fancybox="parcelar" class="adicionarextato" >Parcelar?</a>
						<a href="#repetir"  data-fancybox="repetir" class="adicionarextato" >Repetir?</a>
					</div>
					<div class="col-md-4">
						<div class="select">
											<select name="" id="" class="select-icon">
												<option value="">Forma de Pagamento</option>
												<option value="">Dinheiro</option>
												<option value="">Cartão de Crédito</option>
												<option value="">Cartão de Débito</option>
												<option value="">Cheque</option>
												<option value="">Boleto</option>
												<option value="">Transferência bancária</option>
											</select>
										</div>
					</div>
					<div class="col-md-4">
						<input type="text" name="" placeholder="Centro de custo">
					</div>
					<div class="col-md-6">
						<input style="margin-top:15px;" type="date" name="" placeholder="Vencimento">
					</div>
					<div class="col-md-6">
						<input type="date" name="" placeholder="Pago">
					</div>
					</div>
					<div class="col-md-4">
						<input type="submit" class="btn btn-gradient" value="Salvar">
					</div>
				</div>
			</form>
		</div>
	</div>
	</div>
	</div>

	<!--Modal parcelar  -->
	<div style="width: 70%; " class="modal" id="parcelar">
		<div style="width: 100%" class="modal-box">
			<div class="modal-title">
				<h2>Parcelar</h2>
			</div>
			<div class="form">
				<form action="">
					<div class="row">
						<div class="col-md-6">
							<input type="text" name="" placeholder="Entrada de">
						</div>
						<div class="col-md-6">
							<input type="text" name="" placeholder="Número de Parcelas?">
						</div>
						<div class="col-md-6">
							<input type="text" name="" placeholder="Valor das parcelas">
						</div>
						<div class="col-md-3">
							<input type="submit" class="btn btn-gradient" value="Adicionar">
						</div>
						<div class="col-md-3">
							<input type="submit" class="btn btn-pdf" value="Cancelar">
						</div>
				</form>
			</div>
		</div>
	</div>
	</div>
	<!--Modal parcelar  fim -->

	<!--Modal repetir  -->
	<div style="width: 70%; " class="modal" id="repetir">
		<div style="width: 100%" class="modal-box">
			<div class="modal-title">
				<h2>Repetir</h2>
			</div>
			<div class="form">
				<form action="">
					<div class="row">
						<div class="col-md-6">
							<div class="select">
												<select name="" id="" class="select-icon">
													<option value="">Mensalmente</option>
													<option value="">Semanalmente</option>
													<option value="">Quinzenalmente</option>
													<option value="">Anualmente</option>
												</select>
											</div>
						</div>
						<div class="col-md-6">
							<input type="text" name="" placeholder="Ocorrências de vezes">
						</div>
						<div class="col-md-3">
							<input type="submit" class="btn btn-gradient" value="Adicionar">
						</div>
						<div class="col-md-3">
							<input type="submit" class="btn btn-pdf" value="Cancelar">
						</div>
				</form>
			</div>
		</div>
	</div>
	</div>
	<!--Modal repetir  fim -->

<div style="width: 70%; " class="modal" id="entradasdecaixa">
	<div style="width: 100%" class="modal-box">
		<div class="modal-title">
			<h2>Receita</h2>
		</div>
		<div class="form">
			<form action="">
				<div class="row">
					<div class="col-md-12">
						<input type="text" name="" placeholder="Paciente">
					</div>
					<div class="col-md-4">
						<input type="text" name="" placeholder="Profissional">
					</div>
					<div class="col-md-4">
						<input type="text" name="" placeholder="Convênio">
					</div>
					<div class="col-md-4">
						<input type="text" name="" placeholder="Procedimento">
					</div>
					<div class="col-md-4">
						<input type="text" name="" placeholder="Valor">
					</div>
					<div class="col-md-4">
						<input type="text" name="" placeholder="Descrição">
					</div>
					<div class="col-md-4">
						<input type="text" name="" placeholder="Categoria">
					</div>
					<div class="col-md-4">
						<input type="text" name="" placeholder="Conta">
						<a href="#recebeitaparcelar"  data-fancybox="recebeitaparcelar" class="adicionarextato" >Parcelar?</a>
						<a href="#recebeitarepetir"  data-fancybox="recebeitarepetir" class="adicionarextato" >Repetir?</a>
					</div>
					<div class="col-md-4">
						<div class="select">
											<select name="" id="" class="select-icon">
												<option value="">Forma de Pagamento</option>
												<option value="">Dinheiro</option>
												<option value="">Cartão de Crédito</option>
												<option value="">Cartão de Débito</option>
												<option value="">Cheque</option>
												<option value="">Boleto</option>
												<option value="">Transferência bancária</option>
											</select>
										</div>
					</div>
					<div class="col-md-4">
						<input type="text" name="" placeholder="Centro de custo">
					</div>
					<div class="col-md-6">
						<input style="margin-top: 30px;" type="date" name="" placeholder="Vencimento">
					</div>
					<div class="col-md-6">
						<input type="date" name="" placeholder="Recebido">
					</div>
					<div class="col-md-4">
						<input type="submit" class="btn btn-gradient" value="Salvar">
					</div>
				</div>
			</form>
		</div>
	</div>
</div>

<!--Modal parcelar  -->
<div style="width: 70%; " class="modal" id="recebeitaparcelar">
	<div style="width: 100%" class="modal-box">
		<div class="modal-title">
			<h2>Parcelar</h2>
		</div>
		<div class="form">
			<form action="">
				<div class="row">
					<div class="col-md-6">
						<input type="text" name="" placeholder="Entrada de">
					</div>
					<div class="col-md-6">
						<input type="text" name="" placeholder="Número de Parcelas?">
					</div>
					<div class="col-md-6">
						<input type="text" name="" placeholder="Valor das parcelas">
					</div>
					<div class="col-md-3">
						<input type="submit" class="btn btn-gradient" value="Adicionar">
					</div>
					<div class="col-md-3">
						<input type="submit" class="btn btn-pdf" value="Cancelar">
					</div>
			</form>
		</div>
	</div>
</div>
</div>
<!--Modal parcelar  fim -->

<!--Modal repetir  -->
<div style="width: 70%; " class="modal" id="recebeitarepetir">
	<div style="width: 100%" class="modal-box">
		<div class="modal-title">
			<h2>Repetir</h2>
		</div>
		<div class="form">
			<form action="">
				<div class="row">
					<div class="col-md-6">
						<div class="select">
											<select name="" id="" class="select-icon">
												<option value="">Mensalmente</option>
												<option value="">Semanalmente</option>
												<option value="">Quinzenalmente</option>
												<option value="">Anualmente</option>
											</select>
										</div>
					</div>
					<div class="col-md-6">
						<input type="text" name="" placeholder="Ocorrências de vezes">
					</div>
					<div class="col-md-3">
						<input type="submit" class="btn btn-gradient" value="Adicionar">
					</div>
					<div class="col-md-3">
						<input type="submit" class="btn btn-pdf" value="Cancelar">
					</div>
			</form>
		</div>
	</div>
</div>
</div>
<!--Modal repetir  fim -->
<?php include('includes/footer.php'); ?>
</body>
</html>
